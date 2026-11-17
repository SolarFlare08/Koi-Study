using System;
using System.IO;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Collections.Generic;

// Render the same mountain-and-sun mark at every Windows icon size.
internal static class IconMaker
{
    static void Main(string[] args)
    {
        int[] sizes = {16,24,32,48,64,128,256};
        var images = new List<byte[]>();
        foreach (int size in sizes) using (var bitmap = new Bitmap(size,size)) {
            using (var g = Graphics.FromImage(bitmap)) {
                g.SmoothingMode=SmoothingMode.AntiAlias;
                g.ScaleTransform(size/256f,size/256f);
                using (var background = new SolidBrush(Color.FromArgb(28,57,63))) g.FillEllipse(background,4,4,248,248);
                using (var sun = new SolidBrush(Color.FromArgb(242,216,157))) g.FillEllipse(sun,145,43,51,51);
                using (var mountain = new SolidBrush(Color.FromArgb(107,157,137))) {
                    var path=new GraphicsPath();path.AddBezier(24,180,60,161,71,60,106,77);path.AddBezier(106,77,130,87,149,157,231,183);path.CloseFigure();g.FillPath(mountain,path);path.Dispose();
                }
                using (var front = new SolidBrush(Color.FromArgb(177,207,181))) {
                    var path=new GraphicsPath();path.AddBezier(28,187,74,179,101,134,134,138);path.AddBezier(134,138,171,139,186,181,226,188);path.CloseFigure();g.FillPath(front,path);path.Dispose();
                }
                using (var ripple = new Pen(Color.FromArgb(221,230,198),5)) {ripple.StartCap=LineCap.Round;ripple.EndCap=LineCap.Round;g.DrawLine(ripple,73,207,184,207);g.DrawLine(ripple,103,222,155,222);}
            }
            using(var stream=new MemoryStream()){bitmap.Save(stream,ImageFormat.Png);images.Add(stream.ToArray());}
        }
        using(var output=new BinaryWriter(File.Create(args[0]))) {
            output.Write((short)0);output.Write((short)1);output.Write((short)sizes.Length);
            int offset=6+16*sizes.Length;
            for(int i=0;i<sizes.Length;i++){output.Write((byte)(sizes[i]==256?0:sizes[i]));output.Write((byte)(sizes[i]==256?0:sizes[i]));output.Write((short)0);output.Write((short)1);output.Write((short)32);output.Write(images[i].Length);output.Write(offset);offset+=images[i].Length;}
            foreach(var image in images)output.Write(image);
        }
    }
}
