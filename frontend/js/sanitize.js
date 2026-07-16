function escapeHtml(text) {
    if (text == null) return '';
    var div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function sanitizeUrl(url) {
    if (!url) return '';
    var allowed = /^(https?:\/\/|data:image\/|blob:|\/)/i;
    return allowed.test(url) ? url : '';
}
