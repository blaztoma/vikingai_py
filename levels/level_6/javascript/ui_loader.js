// Set a global flag to indicate the new bundled UI should be used
window.__PYWASM_UI_ACTIVE = true;

class VersionedUILoader {
    constructor(baseUrl, version = 'latest') {
        this.baseUrl = baseUrl;
        this.version = version;
    }

    showSpinner() {
        // Create minimal full-screen overlay spinner to avoid FOUC while resources load
        const styleId = 'pywasm-spinner-style';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                html.pywasm-preloading body { visibility: hidden !important; overflow: hidden !important; }
                .pywasm-spinner-overlay { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: #0b0d12; z-index: 999999; visibility: visible !important; }
                .pywasm-spinner { width: 56px; height: 56px; border: 6px solid rgba(255,255,255,0.15); border-top-color: #ff6a3d; border-radius: 50%; animation: pywasm-spin 1s linear infinite; }
                .pywasm-spinner-text { color: #fff; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; font-size: 14px; margin-top: 16px; opacity: 0.7; text-align:center; }
                @keyframes pywasm-spin { to { transform: rotate(360deg); } }
            `;
            (document.head || document.documentElement).appendChild(style);
        }

        const insertOverlay = () => {
            if (document.querySelector('.pywasm-spinner-overlay')) return; // avoid duplicates
            const overlay = document.createElement('div');
            overlay.className = 'pywasm-spinner-overlay';
            overlay.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
                    <div class="pywasm-spinner" aria-label="Kraunama" role="status"></div>
                    <div class="pywasm-spinner-text">Kraunama…</div>
                </div>
            `;
            // Do NOT clear body; append overlay onto <html> so it survives body replacements
            document.documentElement.appendChild(overlay);
            document.documentElement.classList.add('pywasm-preloading');
        };

        // Insert immediately to avoid any flash, even while DOM is loading
        insertOverlay();
    }

    removeSpinner(force = false) {
        try {
            if (this._spinnerTimeout) {
                clearTimeout(this._spinnerTimeout);
                this._spinnerTimeout = null;
            }
            // Remove preloading class and overlay
            document.documentElement.classList.remove('pywasm-preloading');
            const overlay = document.querySelector('.pywasm-spinner-overlay');
            if (overlay) {
                overlay.remove();
            }
        } catch (e) {
            if (force) {
                // ignore errors
            } else {
                console.warn('Nepavyko pašalinti spinnerio:', e);
            }
        }
    }

    async afterUIReady() {
        // Wait two animation frames to let CSS & layout settle
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }

    async waitForPyodideReady(maxMs = 45000) {
        try {
            const p = (typeof window.__PYODIDE_READY__ !== 'undefined' && window.__PYODIDE_READY__ && typeof window.__PYODIDE_READY__.then === 'function')
                ? window.__PYODIDE_READY__
                : null;
            if (p) {
                // Wait for the provided readiness promise, but not longer than maxMs
                await Promise.race([
                    p,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('pyodide-timeout')), maxMs))
                ]);
                return;
            }
            // Fallback polling: wait until global `pyodide` is present and functional
            const start = Date.now();
            while (Date.now() - start < maxMs) {
                if (window.pyodide && typeof window.pyodide.runPython === 'function') {
                    return;
                }
                await new Promise((r) => setTimeout(r, 100));
            }
            console.warn('Pyodide readiness timeout after', maxMs, 'ms');
        } catch (e) {
            console.warn('Pyodide readiness wait failed:', e);
        }
    }

    async loadUI() {
        try {
            // TODO - later include version management
            // Patikriname naujausią versiją
            // const versionInfo = await fetch(`${this.baseUrl}/version.json`);
            // const versionData = await versionInfo.json();
            // const uiVersion = this.version === 'latest' ? versionData.latest : this.version;

            this.showSpinner();
            // Failsafe: ensure spinner cannot get stuck forever (60s)
            if (!this._spinnerTimeout) {
                this._spinnerTimeout = setTimeout(() => this.removeSpinner(true), 60000);
            }

            await this.loadCSS();
            const response = await fetch(`${this.baseUrl}/ui.html`);
            const htmlContent = await response.text();
            document.body.innerHTML = htmlContent;
            await this.loadJS();
            this.callSetupListeners();
            // Ensure Pyodide engine is fully ready before un-hiding UI to prevent FOUC
            await this.waitForPyodideReady();
            await this.afterUIReady();
            this.removeSpinner();
        } catch (error) {
            console.error('UI įkėlimo klaida:', error);
            this.loadFallback();
            this.removeSpinner(true);
        }
    }

    callSetupListeners() {
        if (typeof setupListeners === 'function') {
            setupListeners();
            onloadPage();
            console.log('setupListeners funkcija iškviesta');
        } else {
            setTimeout(() => {
                if (typeof setupListeners === 'function') {
                    setupListeners();
                    onloadPage();
                    console.log('setupListeners funkcija iškviesta (delayed)');
                } else {
                    console.warn('setupListeners funkcija nerasta');
                }
            }, 100);
        }
    }

    async loadCSS() {
        return new Promise((resolve, reject) => {
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = `${this.baseUrl}/app.bundle.min.css`;

            cssLink.onload = () => {
                console.log('CSS užkrautas');
                resolve();
            };

            cssLink.onerror = () => {
                console.error('CSS įkėlimo klaida');
                reject(new Error('CSS įkėlimo klaida'));
            };

            document.head.appendChild(cssLink);
        });
    }

    async loadJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `${this.baseUrl}/app.bundle.min.js`;

            script.onload = () => {
                console.log('JS užkrautas');
                resolve();
            };

            script.onerror = () => {
                console.error('JS įkėlimo klaida');
                reject(new Error('JS įkėlimo klaida'));
            };

            document.head.appendChild(script);
        });
    }

    loadFallback() {
        const fallbackHTML = localStorage.getItem('fallback-ui') || '<div>UI nepasiekiamas</div>';
        document.body.innerHTML = fallbackHTML;
    }
}

const uiLoader = new VersionedUILoader('https://arzinai.lt/dist/ui/pywasm');

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => uiLoader.loadUI(), { once: true });
} else {
    uiLoader.loadUI();
}

