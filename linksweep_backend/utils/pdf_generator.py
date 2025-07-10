from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from datetime import datetime

def generate_pdf_report(scan_id, results, output_path=None):
    if output_path is None:
        output_path = f"scan_{scan_id}_report.pdf"

    c = canvas.Canvas(output_path, pagesize=letter)
    width, height = letter

    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, height - 50, f"LinkSweep Scan Report")
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 70, f"Scan ID: {scan_id}")
    c.drawString(50, height - 85, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    y = height - 110
    for res in results:
        line = f"[{res['statusCode']}] {res['statusText']} - {res['link']}"
        c.drawString(50, y, line)
        y -= 15
        if y < 50:
            c.showPage()
            y = height - 50

    c.save()
    print(f"📄 PDF Report saved to {output_path}")
    return output_path   # ✅ IMPORTANT: Return file path