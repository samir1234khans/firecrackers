// Keep the initial HTML usable when an entry chunk is stale, blocked or unavailable.
const shell = document.getElementById('boot-shell');
const message = document.getElementById('boot-message');
const recovery = document.getElementById('boot-recovery');
const explain = (text: string) => {
    if (!shell?.isConnected) return;
    if (message) message.textContent = text;
    if (recovery) recovery.hidden = false;
};
const timer = window.setTimeout(() => explain('Still loading. You can reload the website or open compatibility graphics.'), 10000);
void import('./main').then(() => clearTimeout(timer)).catch(() => {
    clearTimeout(timer);
    explain('The app could not finish loading. Check your connection, then reload. Your saved preferences have not been changed.');
});
