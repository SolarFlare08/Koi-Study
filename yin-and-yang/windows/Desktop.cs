using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

internal sealed class Desktop : Form
{
    private const string Home = "https://yin-and-yang.local/";
    private const string CaptureEndpoint = Home + "api/capture-inbox";
    private readonly string profile;
    private readonly bool verify;
    private readonly WebView2 view = new WebView2();
    private FormWindowState priorWindowState;
    private Process captureHelper;
    private readonly Panel chrome = new Panel();
    private bool closingSaved;
    private string lastBackupData;
    private readonly JavaScriptSerializer serializer = new JavaScriptSerializer { MaxJsonLength = 64 * 1024 * 1024 };

    [DllImport("user32.dll")] private static extern bool ReleaseCapture();
    [DllImport("user32.dll")] private static extern IntPtr SendMessage(IntPtr hwnd, int message, IntPtr wparam, IntPtr lparam);

    protected override bool ShowWithoutActivation { get { return verify || base.ShowWithoutActivation; } }

    protected override void WndProc(ref Message message)
    {
        base.WndProc(ref message);
        if (message.Msg != 0x84 || WindowState != FormWindowState.Normal) return;
        var position = PointToClient(new Point(unchecked((short)(long)message.LParam), unchecked((short)((long)message.LParam >> 16))));
        int edge = Math.Max(5, (int)(6 * DeviceDpi / 96.0));
        bool left = position.X < edge, right = position.X >= ClientSize.Width - edge;
        bool top = position.Y < edge, bottom = position.Y >= ClientSize.Height - edge;
        if (top) message.Result = (IntPtr)(left ? 13 : right ? 14 : 12);
        else if (bottom) message.Result = (IntPtr)(left ? 16 : right ? 17 : 15);
        else if (left || right) message.Result = (IntPtr)(left ? 10 : 11);
    }

    private void BuildChrome()
    {
        chrome.Dock = DockStyle.Top;
        chrome.Height = 30;
        chrome.BackColor = BackColor;
        chrome.AccessibleName = "Window controls. Drag to move; double-click to maximize.";
        chrome.MouseDown += delegate(object sender, MouseEventArgs e) {
            if (e.Button != MouseButtons.Left) return;
            ReleaseCapture(); SendMessage(Handle, 0xA1, (IntPtr)2, IntPtr.Zero);
        };
        chrome.DoubleClick += delegate { ToggleMaximize(); };
        foreach (string action in new[] { "Close", "Maximize or restore", "Minimize" })
        {
            var button = new Button { Dock = DockStyle.Right, Width = 42, FlatStyle = FlatStyle.Flat,
                ForeColor = Color.FromArgb(218, 231, 226), BackColor = BackColor, AccessibleName = action,
                TabStop = true, Text = "", Tag = action };
            button.FlatAppearance.BorderSize = 0;
            button.FlatAppearance.MouseOverBackColor = action == "Close" ? Color.FromArgb(130, 63, 60) : Color.FromArgb(47, 68, 77);
            button.Paint += delegate(object sender, PaintEventArgs e) {
                var b = (Button)sender; float x = b.Width / 2f, y = b.Height / 2f;
                using (var pen = new Pen(b.ForeColor, Math.Max(1, DeviceDpi / 96f))) {
                    if ((string)b.Tag == "Close") { e.Graphics.DrawLine(pen,x-4,y-4,x+4,y+4);e.Graphics.DrawLine(pen,x+4,y-4,x-4,y+4); }
                    else if ((string)b.Tag == "Minimize") e.Graphics.DrawLine(pen,x-5,y+3,x+5,y+3);
                    else e.Graphics.DrawRectangle(pen,x-4,y-4,8,8);
                }
            };
            button.Click += delegate(object sender, EventArgs e) {
                string command = (string)((Button)sender).Tag;
                if (command == "Close") Close();
                else if (command == "Minimize") WindowState = FormWindowState.Minimized;
                else ToggleMaximize();
            };
            chrome.Controls.Add(button); button.BringToFront();
        }
        Controls.Add(chrome);
        chrome.BringToFront();
    }

    private void ToggleMaximize()
    {
        MaximizedBounds = Screen.FromHandle(Handle).WorkingArea;
        WindowState = WindowState == FormWindowState.Maximized ? FormWindowState.Normal : FormWindowState.Maximized;
    }

    private Desktop(string profilePath, bool verifyOnly)
    {
        profile = profilePath;
        verify = verifyOnly;
        Text = "Yin and Yang";
        AutoScaleDimensions = new SizeF(96, 96);
        AutoScaleMode = AutoScaleMode.Dpi;
        FormBorderStyle = FormBorderStyle.None;
        Padding = new Padding(5);
        Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
        StartPosition = FormStartPosition.CenterScreen;
        ClientSize = new Size(1240, 780);
        MinimumSize = new Size(540, 620);
        BackColor = Color.FromArgb(24, 42, 54);
        if (verify) { ShowInTaskbar = false; Opacity = 0; }
        view.Dock = DockStyle.Fill;
        Controls.Add(view);
        BuildChrome();
        FormClosing += SaveBeforeClose;
        Shown += async delegate { await StartGarden(); };
        FormClosed += delegate
        {
            if (captureHelper == null) return;
            try { if (!captureHelper.HasExited) captureHelper.Kill(); }
            catch (InvalidOperationException) { }
            finally { captureHelper.Dispose(); }
        };
    }

    private async Task StartGarden()
    {
        try
        {
            Directory.CreateDirectory(profile);
            var environment = await CoreWebView2Environment.CreateAsync(null, Path.Combine(profile, "WebView"));
            await view.EnsureCoreWebView2Async(environment);
            Configure(view.CoreWebView2, true);
            if (verify) view.NavigationCompleted += VerifyGarden;
            else StartCaptureHelper();
            view.Source = new Uri(Home + "index.html");
        }
        catch (Exception error) { StartupFailed(error); }
    }

    private void Configure(CoreWebView2 web, bool mainWindow)
    {
        web.SetVirtualHostNameToFolderMapping("yin-and-yang.local", Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "dist"),
            CoreWebView2HostResourceAccessKind.DenyCors);
        web.Settings.AreHostObjectsAllowed = false;
        web.Settings.IsWebMessageEnabled = mainWindow;
        web.NavigationStarting += delegate(object sender, CoreWebView2NavigationStartingEventArgs args)
        {
            if (args.Uri.StartsWith(Home, StringComparison.OrdinalIgnoreCase) || args.Uri == "about:blank") return;
            args.Cancel = true;
            if (args.IsUserInitiated) OpenExternal(args.Uri);
        };
        web.NewWindowRequested += OpenNewWindow;
        if (!mainWindow) return;
        web.WebMessageReceived += ReceiveMessage;
        web.AddWebResourceRequestedFilter(CaptureEndpoint, CoreWebView2WebResourceContext.All);
        web.WebResourceRequested += ServeCaptureInbox;
        web.ContainsFullScreenElementChanged += delegate
        {
            if (web.ContainsFullScreenElement)
            {
                priorWindowState = WindowState;
                chrome.Visible = false;
                Padding = Padding.Empty;
                MaximizedBounds = Screen.FromHandle(Handle).Bounds;
                WindowState = FormWindowState.Maximized;
            }
            else
            {
                chrome.Visible = true;
                Padding = new Padding(5);
                MaximizedBounds = Screen.FromHandle(Handle).WorkingArea;
                WindowState = priorWindowState;
            }
        };
    }

    private bool IsGarden(string uri)
    {
        return String.Equals(uri, Home + "index.html", StringComparison.OrdinalIgnoreCase);
    }

    private void ReceiveMessage(object sender, CoreWebView2WebMessageReceivedEventArgs args)
    {
        // Only the bundled main document can request these two fixed operations.
        if (!IsGarden(args.Source)) return;
        try {
            var message = serializer.Deserialize<Dictionary<string, object>>(args.WebMessageAsJson);
            object kind;
            if (message == null || !message.TryGetValue("type", out kind)) return;
            if ((string)kind == "open-backups") {
                string directory = Path.Combine(profile, "Backups"); Directory.CreateDirectory(directory);
                Process.Start(new ProcessStartInfo("explorer.exe", '"' + directory + '"') { UseShellExecute = true });
            }
            else if ((string)kind == "backup") {
                object snapshot;
                if (!message.TryGetValue("snapshot", out snapshot)) return;
                WriteBackup(serializer.Serialize(snapshot));
                webBackupResult(null);
            }
        } catch (Exception error) { webBackupResult(error.Message); }
    }

    private void webBackupResult(string error)
    {
        view.CoreWebView2.PostWebMessageAsJson(serializer.Serialize(new {
            type = "backup-result", error = error, at = DateTime.UtcNow.ToString("o")
        }));
    }

    private void WriteBackup(string text)
    {
        if (text == null || text.Length > 64 * 1024 * 1024) throw new InvalidOperationException("Backup is too large.");
        var snapshot = serializer.Deserialize<Dictionary<string, object>>(text);
        if (snapshot == null || !snapshot.ContainsKey("format") || (string)snapshot["format"] != "yin-and-yang-backup" ||
            !snapshot.ContainsKey("data")) throw new InvalidOperationException("Invalid Garden backup.");
        string data = serializer.Serialize(snapshot["data"]);
        if (data == lastBackupData) return;
        string directory = Path.Combine(profile, "Backups");
        Directory.CreateDirectory(directory);
        string file = Path.Combine(directory, "garden-" + DateTime.Now.ToString("yyyyMMdd-HHmmss-fff") + "-" + Guid.NewGuid().ToString("N") + ".json");
        string temporary = file + ".tmp";
        // Move a complete file into place before rotating older snapshots.
        File.WriteAllText(temporary, text, new UTF8Encoding(false));
        File.Move(temporary, file);
        string daily = Path.Combine(directory, "daily-" + DateTime.Now.ToString("yyyyMMdd") + ".json");
        if (!File.Exists(daily)) File.Copy(file, daily);
        foreach (var older in Directory.GetFiles(directory, "garden-*.json").OrderByDescending(p => p).Skip(30)) File.Delete(older);
        foreach (var older in Directory.GetFiles(directory, "daily-*.json").OrderByDescending(p => p).Skip(14)) File.Delete(older);
        lastBackupData = data;
    }

    private async void SaveBeforeClose(object sender, FormClosingEventArgs args)
    {
        if (verify || closingSaved || view.CoreWebView2 == null || !IsGarden(view.CoreWebView2.Source)) return;
        args.Cancel = true;
        if (!Enabled) return;
        Enabled = false;
        try {
            var draftCheck = view.ExecuteScriptAsync("Boolean(window.gardenStudioHasUnsavedChanges && window.gardenStudioHasUnsavedChanges())");
            if (await Task.WhenAny(draftCheck, Task.Delay(8000)) != draftCheck) throw new IOException("Garden Studio did not respond in time.");
            if (await draftCheck == "true" && MessageBox.Show(this, "Discard unsaved changes to this Garden layout?",
                "Unsaved Garden layout", MessageBoxButtons.YesNo, MessageBoxIcon.Warning, MessageBoxDefaultButton.Button2) != DialogResult.Yes) {
                Enabled = true;
                return;
            }
            var request = view.ExecuteScriptAsync("window.gardenDesktopSnapshot ? window.gardenDesktopSnapshot() : null");
            if (await Task.WhenAny(request, Task.Delay(8000)) != request) throw new IOException("The backup did not respond in time.");
            var value = serializer.Deserialize<string>(await request);
            if (value != null) WriteBackup(value);
        } catch (Exception error) {
            Enabled = true;
            if (MessageBox.Show(this, "The closing backup could not be saved. Your usual saved data is still in the app profile.\n\n" + error.Message + "\n\nClose anyway?",
                "Backup needs attention", MessageBoxButtons.YesNo, MessageBoxIcon.Warning) != DialogResult.Yes) return;
        }
        closingSaved = true; Close();
    }

    private static void OpenExternal(string value)
    {
        Uri uri;
        if (Uri.TryCreate(value, UriKind.Absolute, out uri) && (uri.Scheme == "https" || uri.Scheme == "http"))
            Process.Start(new ProcessStartInfo(uri.AbsoluteUri) { UseShellExecute = true });
    }

    private async void OpenNewWindow(object sender, CoreWebView2NewWindowRequestedEventArgs args)
    {
        args.Handled = true;
        if (!args.IsUserInitiated) return;
        bool mini = String.Equals(args.Uri, Home + "mini-timer.html", StringComparison.OrdinalIgnoreCase);
        if (!mini && !String.Equals(args.Uri, Home + "capture.html", StringComparison.OrdinalIgnoreCase))
        {
            OpenExternal(args.Uri);
            return;
        }

        var deferred = args.GetDeferral();
        var popup = new Form { Text = mini ? "Garden mini timer" : "Yin and Yang · Quick capture", ShowInTaskbar = mini,
            TopMost = mini, Size = mini ? new Size(390, 380) : new Size(400, 330), StartPosition = FormStartPosition.CenterParent };
        var browser = new WebView2 { Dock = DockStyle.Fill };
        popup.Controls.Add(browser);
        try
        {
            if (mini) popup.Show(); else popup.Show(this);
            await browser.EnsureCoreWebView2Async(view.CoreWebView2.Environment);
            Configure(browser.CoreWebView2, false);
            browser.CoreWebView2.WindowCloseRequested += delegate { popup.Close(); };
            args.NewWindow = browser.CoreWebView2;
        }
        catch (Exception error)
        {
            popup.Dispose();
            MessageBox.Show(this, error.Message, "Could not open quick capture", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }
        finally { deferred.Complete(); }
    }

    private void StartCaptureHelper()
    {
        var path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "QuickNote.exe");
        if (!File.Exists(path)) return;
        try
        {
            captureHelper = Process.Start(new ProcessStartInfo(path, '"' + Path.Combine(profile, "Capture") + '"')
                { UseShellExecute = false, CreateNoWindow = true });
        }
        catch (System.ComponentModel.Win32Exception) { /* In-app quick capture is still available. */ }
    }

    private void ServeCaptureInbox(object sender, CoreWebView2WebResourceRequestedEventArgs args)
    {
        if (args.Request.Uri != CaptureEndpoint || args.Request.Method != "GET") return;
        var notes = new List<Dictionary<string, object>>();
        var directory = Path.Combine(profile, "Capture");
        var json = new JavaScriptSerializer();
        if (Directory.Exists(directory))
        {
            foreach (var file in Directory.GetFiles(directory, "*.json"))
            {
                var id = Path.GetFileNameWithoutExtension(file);
                if (!Regex.IsMatch(id, "^[a-f0-9]{32}$")) continue;
                try
                {
                    if (new FileInfo(file).Length > 65536) continue;
                    var note = json.Deserialize<Dictionary<string, object>>(File.ReadAllText(file));
                    if (note == null) continue;
                    note["id"] = id;
                    notes.Add(note);
                }
                catch (IOException) { }
                catch (ArgumentException) { }
                catch (InvalidOperationException) { }
            }
        }
        var content = new MemoryStream(Encoding.UTF8.GetBytes(json.Serialize(notes)));
        args.Response = view.CoreWebView2.Environment.CreateWebResourceResponse(content, 200, "OK",
            "Content-Type: application/json; charset=utf-8\r\nCache-Control: no-store");
    }

    private async void VerifyGarden(object sender, CoreWebView2NavigationCompletedEventArgs args)
    {
        view.NavigationCompleted -= VerifyGarden;
        try
        {
            if (!args.IsSuccess) throw new InvalidOperationException("Garden navigation failed: " + args.WebErrorStatus);
            for (int attempt = 0; attempt < 60; attempt++)
            {
                string result = await view.ExecuteScriptAsync("(function(){if (!document.querySelector('#edit-duration')?.onclick) return ''; const k='desktop-verification';const old=localStorage.getItem(k);localStorage.setItem(k,'saved');return old ? 'persisted' : 'ready';})()");
                if (result == "\"ready\"" || result == "\"persisted\"")
                {
                    string snapshot = serializer.Deserialize<string>(await view.ExecuteScriptAsync("window.gardenDesktopSnapshot()"));
                    WriteBackup(snapshot);
                    var checks = await view.ExecuteScriptAsync(@"(function(){try{
                        const goal=document.querySelector('.daily-focus-goal');
                        if(!goal||!document.querySelector('#compass-progress'))throw Error('Focus controls missing');
                        const state=()=>JSON.parse(localStorage.getItem('yin-and-yang.v1'));
                        const times=document.querySelector('.quick-timer-button'),options=document.querySelector('.quick-timer-dialog');
                        times.click();const preset=options.querySelector('[data-minutes=""45""]');
                        if(!options.open||!preset)throw Error('Quick times did not offer 45 minutes');
                        preset.click();
                        if(options.open||state().timer.total!==2700000)throw Error('Quick times did not set 45 minutes');
                        const toggle=document.querySelector('#toggle-timer');toggle.click();const running=state().timer;
                        times.click();const add=options.querySelector('[data-minutes=""5""]');
                        if(!options.open||!add)throw Error('Running timer did not offer a five-minute extension');
                        add.click();
                        const extended=state().timer;
                        if(extended.id!==running.id||extended.endAt!==running.endAt+300000)throw Error('Timer extension changed the session');
                        document.querySelector('#reset-timer').click();
                        if(state().timer.total!==2700000)throw Error('Reset retained the extension');
                        goal.click();const dialog=document.querySelector('.focus-goal-dialog');
                        if(!dialog.open)throw Error('Daily goal did not open');
                        const days=dialog.querySelectorAll('[data-focus-day]');
                        const skipped=state().history.filter(h=>h.day===days[6]?.dataset.focusDay&&h.mode==='focus'&&h.outcome==='skipped');
                        if(days.length!==7||!skipped.some(h=>h.id===running.id)||!dialog.querySelector('.focus-week-detail').textContent.endsWith(skipped.length+' skipped'))throw Error('Focus week must include the skipped session');
                        days[0].click();
                        if(days[0].getAttribute('aria-pressed')!=='true')throw Error('Focus week day selection failed');
                        dialog.querySelector('input').value='90';dialog.querySelector('[value=save]').click();
                        if(dialog.open)throw Error('Daily goal did not save');
                        document.querySelector('.session-tools-toggle').click();
                        if(document.querySelector('.session-tools').hidden)throw Error('Session tools did not open');
                        document.querySelector('.session-tools-toggle').click();
                        document.querySelector('#automatic-backup-now').click();
                        return state().settings.dailyFocusGoal===90?'passed':'Daily goal was not persisted';
                    }catch(error){return error.message;}})()");
                    if (checks != "\"passed\"") throw new InvalidOperationException("UI checks failed: " + checks);
                    await Task.Delay(600);
                    string backupCheck = await view.ExecuteScriptAsync(@"(function(){
                        const point=document.querySelector('[data-restore-point]');
                        if(!point) return 'No automatic restore point';
                        const dialog=document.querySelector('#backup-dialog');dialog.showModal();point.click();
                        const ok=!document.querySelector('#backup-preview').hidden&&document.querySelector('#backup-preview-sections input');
                        dialog.close();return ok?'passed':'Restore preview failed';
                    })()");
                    if (backupCheck != "\"passed\"") throw new InvalidOperationException("Backup check: " + backupCheck);
                    using (var screenshot = File.Create(Path.Combine(profile, "garden.png")))
                        await view.CoreWebView2.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png, screenshot);
                    using (var strip = new Bitmap(chrome.Width, chrome.Height)) {
                        chrome.DrawToBitmap(strip, chrome.ClientRectangle);
                        strip.Save(Path.Combine(profile, "window-controls.png"));
                    }
                    await view.ExecuteScriptAsync("document.querySelector('#toast').classList.remove('visible');document.querySelector('.session-tools-toggle').click()");
                    using (var screenshot = File.Create(Path.Combine(profile, "session-tools.png")))
                        await view.CoreWebView2.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png, screenshot);
                    await view.ExecuteScriptAsync("document.querySelector('.session-tools-toggle').click()");
                    ClientSize = new Size(560, 720);
                    await Task.Delay(400);
                    using (var screenshot = File.Create(Path.Combine(profile, "compact.png")))
                        await view.CoreWebView2.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png, screenshot);
                    await view.ExecuteScriptAsync("document.querySelector('.daily-focus-goal').click()");
                    using (var screenshot = File.Create(Path.Combine(profile, "focus-week.png")))
                        await view.CoreWebView2.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png, screenshot);
                    File.WriteAllText(Path.Combine(profile, "display.txt"), "DPI: " + DeviceDpi + "; icon: " + Icon.Size);
                    if (Directory.GetFiles(Path.Combine(profile, "Backups"), "garden-*.json").Length < 1)
                        throw new InvalidOperationException("No desktop backup created.");
                    File.WriteAllText(Path.Combine(profile, "verify.txt"), result.Trim('"'));
                    Close();
                    return;
                }
                await Task.Delay(100);
            }
            throw new InvalidOperationException("The Garden did not initialize.");
        }
        catch (Exception error) { StartupFailed(error); }
    }

    private void StartupFailed(Exception error)
    {
        Environment.ExitCode = 1;
        if (verify) File.WriteAllText(Path.Combine(profile, "verify.txt"), error.ToString());
        else MessageBox.Show(this, "Yin and Yang could not open. Check that the Microsoft Edge WebView2 Runtime is installed.\n\n" + error.Message,
            "Yin and Yang", MessageBoxButtons.OK, MessageBoxIcon.Error);
        Close();
    }

    [STAThread]
    private static void Main(string[] args)
    {
        bool verifying = args.Length == 2 && args[0] == "--verify";
        string directory = verifying ? Path.GetFullPath(args[1]) :
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Yin and Yang");
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        bool first;
        using (var instance = new Mutex(true, verifying ? @"Local\YinAndYangDesktopVerify" : @"Local\YinAndYangDesktop", out first))
        {
            if (!first)
            {
                if (!verifying) MessageBox.Show("Yin and Yang is already open.", "Yin and Yang");
                return;
            }
            using (var window = new Desktop(directory, verifying)) Application.Run(window);
        }
    }
}
