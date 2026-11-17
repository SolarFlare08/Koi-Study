using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
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

    private Desktop(string profilePath, bool verifyOnly)
    {
        profile = profilePath;
        verify = verifyOnly;
        Text = "Yin and Yang";
        Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
        StartPosition = FormStartPosition.CenterScreen;
        ClientSize = new Size(1240, 780);
        MinimumSize = new Size(520, 420);
        BackColor = Color.FromArgb(24, 42, 54);
        if (verify) { ShowInTaskbar = false; Opacity = 0; }
        view.Dock = DockStyle.Fill;
        Controls.Add(view);
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
        web.Settings.IsWebMessageEnabled = false;
        web.NavigationStarting += delegate(object sender, CoreWebView2NavigationStartingEventArgs args)
        {
            if (args.Uri.StartsWith(Home, StringComparison.OrdinalIgnoreCase) || args.Uri == "about:blank") return;
            args.Cancel = true;
            if (args.IsUserInitiated) OpenExternal(args.Uri);
        };
        web.NewWindowRequested += OpenNewWindow;
        if (!mainWindow) return;
        web.AddWebResourceRequestedFilter(CaptureEndpoint, CoreWebView2WebResourceContext.All);
        web.WebResourceRequested += ServeCaptureInbox;
        web.ContainsFullScreenElementChanged += delegate
        {
            if (web.ContainsFullScreenElement)
            {
                priorWindowState = WindowState;
                FormBorderStyle = FormBorderStyle.None;
                WindowState = FormWindowState.Maximized;
            }
            else
            {
                FormBorderStyle = FormBorderStyle.Sizable;
                WindowState = priorWindowState;
            }
        };
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
        if (!String.Equals(args.Uri, Home + "capture.html", StringComparison.OrdinalIgnoreCase))
        {
            OpenExternal(args.Uri);
            return;
        }

        var deferred = args.GetDeferral();
        var popup = new Form { Text = "Yin and Yang · Quick capture", Owner = this, ShowInTaskbar = false,
            Size = new Size(400, 330), StartPosition = FormStartPosition.CenterParent };
        var browser = new WebView2 { Dock = DockStyle.Fill };
        popup.Controls.Add(browser);
        try
        {
            popup.Show(this);
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
