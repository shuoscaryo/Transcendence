export function timeAgo(isoString) {
    const now = new Date();
    const past = new Date(isoString);
    const diffMs = now - past;

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours   = Math.floor(minutes / 60);
    const days    = Math.floor(hours / 24);

    if (seconds < 60) return 'few seconds ago';
    if (minutes < 60) return `${minutes}min ago`;
    if (hours < 24)   return `${hours}h ago`;
    return `${days}d ago`;
}

export function formatTimeAgo(isoString) {
    const now = new Date();
    const lastOnline = new Date(isoString);
    const diffMs = now - lastOnline;
    const days = diffMs / (1000 * 60 * 60 * 24);

    if (days >= 7) {
        return lastOnline.toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } else {
        return timeAgo(isoString);
    }
}

export function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
}