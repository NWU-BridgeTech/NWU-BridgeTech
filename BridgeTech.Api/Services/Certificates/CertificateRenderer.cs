using QRCoder;
using SkiaSharp;
using BridgeTech.Api.DTOs.Certificates;

namespace BridgeTech.Api.Services.Certificates;

public interface ICertificateRenderer
{
    byte[] Render(CertificateResponse certificate, string format);
}

public sealed class CertificateRenderer(IConfiguration configuration) : ICertificateRenderer
{
    private const int Width = 1600;
    private const int Height = 1000;
    private static readonly SKColor Navy = SKColor.Parse("#0E1A33");
    private static readonly SKColor Gold = SKColor.Parse("#D9AA3A");
    private static readonly SKColor Cream = SKColor.Parse("#F4EDDB");

    public byte[] Render(CertificateResponse certificate, string format)
    {
        if (format.Equals("pdf", StringComparison.OrdinalIgnoreCase))
            return RenderPdf(certificate);

        using var bitmap = new SKBitmap(Width, Height);
        using var canvas = new SKCanvas(bitmap);
        canvas.Clear(Navy);

        using var goldPen = new SKPaint { Color = Gold, Style = SKPaintStyle.Stroke, StrokeWidth = 2, IsAntialias = true };
        canvas.DrawRect(42, 42, Width - 84, Height - 84, goldPen);
        goldPen.StrokeWidth = 1;
        canvas.DrawRect(64, 64, Width - 128, Height - 128, goldPen);

        DrawDiamond(canvas, 64, 64);
        DrawDiamond(canvas, Width - 64, 64);
        DrawDiamond(canvas, 64, Height - 64);
        DrawDiamond(canvas, Width - 64, Height - 64);

        DrawText(canvas, "BRIDGETECH", 800, 170, 28, Gold, true, SKTextAlign.Center, "Georgia");
        DrawText(canvas, "Certificate of completion", 800, 310, 66, Cream, true, SKTextAlign.Center, "Georgia");
        DrawText(canvas, "This certifies that", 800, 375, 24, Cream, false, SKTextAlign.Center, "Georgia");
        DrawText(canvas, certificate.StudentName, 800, 470, 62, Gold, true, SKTextAlign.Center, "Georgia");

        using var underline = new SKPaint { Color = Gold, StrokeWidth = 1, IsAntialias = true };
        canvas.DrawLine(430, 495, 1170, 495, underline);
        DrawText(canvas, $"has successfully completed {certificate.ModuleTitle}.", 800, 555, 25, Cream, true, SKTextAlign.Center, "Georgia");
        DrawText(canvas, "BridgeTech industry-readiness programme", 800, 592, 25, Cream, true, SKTextAlign.Center, "Georgia");

        DrawText(canvas, "Programme director", 300, 820, 22, Cream, false, SKTextAlign.Center, "Georgia");
        canvas.DrawLine(150, 785, 450, 785, underline);
        DrawText(canvas, "Date completed", 1300, 820, 22, Cream, false, SKTextAlign.Center, "Georgia");
        canvas.DrawLine(1150, 785, 1450, 785, underline);
        DrawText(canvas, certificate.IssuedAt.ToString("dd MMMM yyyy"), 1300, 855, 20, Gold, true, SKTextAlign.Center, "Georgia");
        DrawText(canvas, certificate.CertificateNumber, 800, 920, 20, Cream, false, SKTextAlign.Center, "Georgia");

        using var qrGenerator = new QRCodeGenerator();
        using var qrData = qrGenerator.CreateQrCode(VerificationUrl(certificate.CertificateNumber), QRCodeGenerator.ECCLevel.Q);
        var qrBytes = new PngByteQRCode(qrData).GetGraphic(5);
        using var qrBitmap = SKBitmap.Decode(qrBytes);
        canvas.DrawBitmap(qrBitmap, new SKRect(1320, 120, 1460, 260));
        DrawText(canvas, "Scan to verify", 1390, 285, 16, Cream, false, SKTextAlign.Center, "Arial");

        using var image = SKImage.FromBitmap(bitmap);
        var imageFormat = format.Equals("jpeg", StringComparison.OrdinalIgnoreCase) || format.Equals("jpg", StringComparison.OrdinalIgnoreCase)
            ? SKEncodedImageFormat.Jpeg
            : SKEncodedImageFormat.Png;
        return image.Encode(imageFormat, imageFormat == SKEncodedImageFormat.Jpeg ? 94 : 100).ToArray();
    }

    private byte[] RenderPdf(CertificateResponse certificate)
    {
        var png = Render(certificate, "png");
        using var bitmap = SKBitmap.Decode(png);
        using var output = new MemoryStream();
        using var document = SKDocument.CreatePdf(output);
        using var page = document.BeginPage(Width, Height);
        page.DrawBitmap(bitmap, 0, 0);
        document.EndPage();
        document.Close();
        return output.ToArray();
    }

    private string VerificationUrl(string certificateNumber)
    {
        var verificationBaseUrl = configuration["Certificates:VerificationBaseUrl"]
            ?? "http://localhost:5174/api/certificates/verify";
        return $"{verificationBaseUrl.TrimEnd('/')}/{Uri.EscapeDataString(certificateNumber)}";
    }

    private static void DrawText(SKCanvas canvas, string text, float x, float y, float size, SKColor color, bool bold, SKTextAlign align, string family)
    {
        using var paint = new SKPaint
        {
            Color = color,
            IsAntialias = true,
            TextSize = size,
            TextAlign = align,
            Typeface = SKTypeface.FromFamilyName(family, bold ? SKFontStyle.Bold : SKFontStyle.Normal)
        };
        canvas.DrawText(text, x, y, paint);
    }

    private static void DrawDiamond(SKCanvas canvas, float x, float y)
    {
        using var paint = new SKPaint { Color = Gold, Style = SKPaintStyle.Fill, IsAntialias = true };
        using var path = new SKPath();
        path.MoveTo(x, y - 12);
        path.LineTo(x + 12, y);
        path.LineTo(x, y + 12);
        path.LineTo(x - 12, y);
        path.Close();
        canvas.DrawPath(path, paint);
    }
}
