using System;
using System.Drawing;
using System.Drawing.Drawing2D;
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
    private static readonly Color Paper = Color.FromArgb(32, 47, 69);
    private static readonly Color Field = Color.FromArgb(24, 38, 59);
    private static readonly Color Ink = Color.FromArgb(237, 243, 248);
    private static readonly Color Muted = Color.FromArgb(180, 199, 217);
    private static readonly Color Accent = Color.FromArgb(169, 204, 228);
    private static readonly Color Line = Color.FromArgb(83, 109, 134);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool RegisterHotKey(IntPtr window, int id, uint modifiers, uint key);
    [DllImport("user32.dll")]
    private static extern bool UnregisterHotKey(IntPtr window, int id);
    [DllImport("user32.dll")]
    private static extern bool ReleaseCapture();
    [DllImport("user32.dll")]
    private static extern IntPtr SendMessage(IntPtr window, int message, IntPtr wParam, IntPtr lParam);

    private readonly string inbox;
    private readonly TextBox thought;
    private readonly Label status;
    private readonly NotifyIcon tray;
    private bool quitting;

    private QuickNote(string directory)
    {
        inbox = directory;
        Text = "Quick note · Yin and Yang";
        FormBorderStyle = FormBorderStyle.None;
        StartPosition = FormStartPosition.Manual;
        ShowInTaskbar = false;
        TopMost = true;
        KeyPreview = true;
        AutoScaleDimensions = new SizeF(96F, 96F);
        AutoScaleMode = AutoScaleMode.Dpi;
        ClientSize = new Size(358, 210);
        BackColor = Paper;
        ForeColor = Ink;
        Font = new Font("Segoe UI", 9F);

        var eyebrow = new Label { Text = "YIN AND YANG", Location = new Point(17, 14), AutoSize = true, ForeColor = Accent, Font = new Font("Segoe UI", 7.5F, FontStyle.Bold) };
        var heading = new Label { Text = "Quick note", Font = new Font("Georgia", 16F), Location = new Point(15, 30), AutoSize = true };
        Controls.Add(eyebrow);
        Controls.Add(heading);
        MouseDown += DragWindow;
        eyebrow.MouseDown += DragWindow;
        heading.MouseDown += DragWindow;

        var close = new Button { Text = "×", AccessibleName = "Hide quick note", Location = new Point(311, 11), Size = new Size(32, 29), FlatStyle = FlatStyle.Flat, ForeColor = Muted, TabIndex = 2 };
        close.FlatAppearance.BorderSize = 0;
        close.FlatAppearance.MouseOverBackColor = Field;
        close.SizeChanged += delegate { RoundCorners(close, 12); };
        RoundCorners(close, 12);
        close.Click += delegate { Hide(); };
        Controls.Add(close);

        var editor = new Panel { Location = new Point(17, 64), Size = new Size(324, 88), Padding = new Padding(10, 8, 10, 8), BackColor = Field };
        editor.Paint += delegate(object sender, PaintEventArgs args) {
            using (var pen = new Pen(Line)) args.Graphics.DrawRectangle(pen, 0, 0, editor.Width - 1, editor.Height - 1);
        };
        thought = new TextBox { Dock = DockStyle.Fill, BorderStyle = BorderStyle.None, Multiline = true, AcceptsReturn = true, MaxLength = 1000, BackColor = Field, ForeColor = Ink, AccessibleName = "Quick note", TabIndex = 0 };
        editor.Controls.Add(thought);
        Controls.Add(editor);
        var save = new Button { Text = "Save note", Location = new Point(17, 163), Size = new Size(91, 31), FlatStyle = FlatStyle.Flat, BackColor = Color.FromArgb(190, 217, 236), ForeColor = Field, TabIndex = 1 };
        save.FlatAppearance.BorderSize = 0;
        save.FlatAppearance.MouseOverBackColor = Color.FromArgb(211, 233, 247);
        save.SizeChanged += delegate { RoundCorners(save, 12); };
        RoundCorners(save, 12);
        save.Click += delegate { SaveNote(); };
        Controls.Add(save);
        status = new Label { Text = "Ctrl+Enter saves · Esc hides", Location = new Point(119, 163), Size = new Size(222, 31), ForeColor = Muted, TextAlign = ContentAlignment.MiddleLeft };
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

    protected override void OnSizeChanged(EventArgs args)
    {
        base.OnSizeChanged(args);
        RoundCorners(this, 24);
    }

    private static void RoundCorners(Control control, int curve)
    {
        Size size = control.ClientSize;
        if (size.Width < curve || size.Height < curve) return;
        int right = size.Width - curve;
        int bottom = size.Height - curve;
        using (var outline = new GraphicsPath())
        {
            outline.AddArc(0, 0, curve, curve, 180, 90);
            outline.AddArc(right, 0, curve, curve, 270, 90);
            outline.AddArc(right, bottom, curve, curve, 0, 90);
            outline.AddArc(0, bottom, curve, curve, 90, 90);
            outline.CloseFigure();
            var previous = control.Region;
            control.Region = new Region(outline);
            if (previous != null) previous.Dispose();
        }
    }

    private void DragWindow(object sender, MouseEventArgs args)
    {
        if (args.Button != MouseButtons.Left) return;
        ReleaseCapture();
        SendMessage(Handle, 0x00A1, new IntPtr(2), IntPtr.Zero);
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
