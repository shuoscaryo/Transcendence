from django.http import HttpResponse

def login_42(request):
    code = request.GET.get("code")
    if not code:
        return HttpResponse("Error: no code")

    # Aquí iría el login real...
    # Pero por ahora hacemos solo el cierre del popup:

    html = """
    <html><body>
    <script>
        window.opener.postMessage({ success: true }, "*");
        window.close();
    </script>
    </body></html>
    """
    return HttpResponse(html)