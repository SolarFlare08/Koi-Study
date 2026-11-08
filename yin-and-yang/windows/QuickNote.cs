using System;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Web.Script.Serialization;
using System.Windows.Forms;

internal sealed class QuickNote : Form
{
    private const int HotkeyId = 1;
    private const int HotkeyMessage = 0x0312;
    private const uint CtrlAltNoRepeat = 0x4003;

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool RegisterHotKey(IntPtr window, int id, uint modifiers, uint key);
    [DllImport("user32.dll")]
    private static extern bool UnregisterHotKey(IntPtr window, int id);

    private readonly string inbox;
    private readonly TextBox thought;
    private readonly Label status;
    private readonly NotifyIcon tray;
    private bool quitting;

    private QuickNote(string directory)
    {
        inbox = directory;
        Text = "Quick note · Yin and Yang";
        FormBorderStyle = FormBorderStyle.FixedToolWindow;
        StartPosition = FormStartPosition.Manual;
        ShowInTaskbar = false;
        TopMost = true;
        KeyPreview = true;
        ClientSize = new Size(356, 211);
        BackColor = Color.FromArgb(246, 241, 222);
        ForeColor = Color.FromArgb(53, 82, 75);
        Font = new Font("Segoe UI", 9F);

        Controls.Add(new Label { Text = "Leave a thought here.", Font = new Font("Georgia", 17F), Location = new Point(14, 12), AutoSize = true });
        thought = new TextBox { Location = new Point(15, 48), Size = new Size(326, 92), Multiline = true, ScrollBars = ScrollBars.Vertical, MaxLength = 1000, BackColor = Color.FromArgb(255, 252, 240), AccessibleName = "Quick note" };
        Controls.Add(thought);
        var save = new Button { Text = "Save note", Location = new Point(15, 150), Size = new Size(100, 31), FlatStyle = FlatStyle.Flat, BackColor = Color.FromArgb(64, 104, 90), ForeColor = Color.White };
        save.Click += delegate { SaveNote(); };
        Controls.Add(save);
        status = new Label { Text = "Ctrl+Enter saves · Esc hides", Location = new Point(15, 186), Size = new Size(326, 19), ForeColor = ForeColor };
        Controls.Add(status);

        var menu = new ContextMenuStrip();
        menu.Items.Add("Quick note (Ctrl+Alt+N)", null, delegate { ShowAtCursor(); });
        menu.Items.Add("Quit Yin and Yang quick note", null, delegate { Quit(); });
        tray = new NotifyIcon { Icon = SystemIcons.Information, Text = "Yin and Yang quick note", ContextMenuStrip = menu };
        tray.DoubleClick += delegate { ShowAtCursor(); };
        FormClosing += delegate(object sender, FormClosingEventArgs args) {
            if (!quitting && args.CloseReason == CloseReason.UserClosing) { args.Cancel = true; Hide(); }
        };
    }

    private void ShowAtCursor()
    {
        var cursor = Cursor.Position;
        var area = Screen.FromPoint(cursor).WorkingArea;
        int x = cursor.X + 12;
        int y = cursor.Y + 12;
        if (x + Width > area.Right) x = cursor.X - Width - 12;
        if (y + Height > area.Bottom) y = cursor.Y - Height - 12;
        Location = new Point(Math.Max(area.Left, Math.Min(x, area.Right - Width)), Math.Max(area.Top, Math.Min(y, area.Bottom - Height)));
        if (!Visible) Show();
        Activate();
        thought.Focus();
    }

    private void SaveNote()
    {
        string text = thought.Text.Trim();
        if (text.Length == 0) { thought.Focus(); return; }
        try
        {
            Directory.CreateDirectory(inbox);
            string basePath = Path.Combine(inbox, Guid.NewGuid().ToString("N"));
            long createdAt = (long)(DateTime.UtcNow - new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalMilliseconds;
            string json = new JavaScriptSerializer().Serialize(new { text = text, createdAt = createdAt });
            File.WriteAllText(basePath + ".tmp", json, new UTF8Encoding(false));
            File.Move(basePath + ".tmp", basePath + ".json");
            thought.Clear();
            status.Text = "Ctrl+Enter saves · Esc hides";
            Hide();
        }
        catch (Exception error)
        {
            if (!(error is IOException) && !(error is UnauthorizedAccessException)) throw;
            status.Text = "Could not save. Your draft is still here.";
        }
    }

    protected override bool ProcessCmdKey(ref Message message, Keys keys)
    {
        if (keys == Keys.Escape) { Hide(); return true; }
        if (keys == (Keys.Control | Keys.Enter)) { SaveNote(); return true; }
        return base.ProcessCmdKey(ref message, keys);
    }

    protected override void WndProc(ref Message message)
    {
        if (message.Msg == HotkeyMessage && message.WParam.ToInt32() == HotkeyId) ShowAtCursor();
        base.WndProc(ref message);
    }

    private void Quit()
    {
        quitting = true;
        Application.ExitThread();
    }

    [STAThread]
    private static int Main(string[] args)
    {
        if (args.Length != 1) return 1;
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        using (var note = new QuickNote(args[0]))
        using (note.tray)
        {
            IntPtr handle = note.Handle;
            if (!RegisterHotKey(handle, HotkeyId, CtrlAltNoRepeat, (uint)Keys.N))
            {
                Console.Error.WriteLine("Ctrl+Alt+N could not be registered (Windows error {0}).", Marshal.GetLastWin32Error());
                return 1;
            }
            note.tray.Visible = true;
            Console.WriteLine("Ctrl+Alt+N is ready. Quit from the tray icon or press Ctrl+C.");
            try { Application.Run(); }
            finally { UnregisterHotKey(handle, HotkeyId); note.tray.Visible = false; }
        }
        return 0;
    }
}
