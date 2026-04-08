/**
 * 生活管理 H5 应用
 */

(function() {
    'use strict';

    const CONFIG = {
        contentPath: 'content/',
        defaultPage: 'health',
        pages: ['plan', 'health', 'fitness', 'mind', 'hobby']
    };

    let currentPage = CONFIG.defaultPage;
    let navigationStack = [];
    let contentEl, navItems, sidebar, sidebarOverlay, sidebarToggle, sidebarCloseEl, sidebarContent;

    function getUrlParam(p) {
        return new URLSearchParams(location.search).get(p);
    }

    // 检测是否为移动端
    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || window.innerWidth < 768;
    }

    function setUrlParam(p, v) {
        const url = new URL(location.href);
        url.searchParams.set(p, v);
        history.pushState({}, '', url);
    }

    function init() {
        contentEl = document.getElementById('content');
        navItems = document.querySelectorAll('.nav-item');
        sidebar = document.getElementById('sidebar');
        sidebarOverlay = document.getElementById('sidebarOverlay');
        sidebarToggle = document.getElementById('sidebarToggle');
        sidebarCloseEl = document.getElementById('sidebarClose');
        sidebarContent = document.getElementById('sidebarContent');

        if (typeof marked !== 'undefined') {
            marked.setOptions({ breaks: true, gfm: true });
            initTabExtension();
        }

        // TAB 扩展：预处理方式，将 === 语法转换为 HTML
        function initTabExtension() {
            marked.use({
                hooks: {
                    preprocess(markdown) {
                        return parseTabs(markdown);
                    }
                }
            });
        }

        // 解析 TAB 语法
        function parseTabs(md) {
            const lines = md.split('\n');
            const result = [];
            let i = 0;

            while (i < lines.length) {
                const line = lines[i];
                const match = line.match(/^(===\+?)\s*"([^"]+)"$/);

                if (match) {
                    // 开始收集 TAB 组
                    const tabs = [];
                    let rawLines = [];

                    while (i < lines.length) {
                        const tabMatch = lines[i].match(/^(===\+?)\s*"([^"]+)"$/);
                        if (tabMatch) {
                            const isDefault = tabMatch[1] === '===+';
                            const title = tabMatch[2];
                            const contentLines = [];
                            rawLines.push(lines[i]);
                            i++;

                            // 收集缩进内容
                            while (i < lines.length) {
                                const contentLine = lines[i];
                                if (contentLine.match(/^(===\+?)\s*"/)) {
                                    break; // 下一个 TAB
                                }
                                if (contentLine.startsWith('    ') || contentLine.startsWith('\t')) {
                                    contentLines.push(contentLine.replace(/^(\t|    )/, ''));
                                    rawLines.push(contentLine);
                                } else if (contentLine.trim() === '') {
                                    contentLines.push('');
                                    rawLines.push(contentLine);
                                } else {
                                    break; // 非缩进行，TAB 内容结束
                                }
                                i++;
                            }

                            const content = contentLines.join('\n').trim();
                            if (content) {
                                tabs.push({ isDefault, title, content });
                            }
                        } else {
                            break;
                        }
                    }

                    if (tabs.length > 0) {
                        result.push(renderTabs(tabs));
                    }
                } else {
                    result.push(line);
                    i++;
                }
            }

            return result.join('\n');
        }

        // 渲染 TAB HTML
        function renderTabs(tabs) {
            const hasDefault = tabs.some(t => t.isDefault);

            let html = '<div class="tabbed-set">\n<div class="tabbed-labels">\n';

            tabs.forEach((tab, i) => {
                const isActive = tab.isDefault || (!hasDefault && i === 0);
                const activeClass = isActive ? ' active' : '';
                html += `<label class="tabbed-label${activeClass}" data-tab="${i}">${tab.title}</label>\n`;
            });

            html += '</div>\n<div class="tabbed-content">\n';

            tabs.forEach((tab, i) => {
                const isActive = tab.isDefault || (!hasDefault && i === 0);
                const activeClass = isActive ? ' active' : '';
                // 先递归处理嵌套TAB，再交给marked解析
                const processedContent = parseTabs(tab.content);
                const contentHtml = marked.parse(processedContent);
                html += `<div class="tabbed-panel${activeClass}" data-tab="${i}">${contentHtml}</div>\n`;
            });

            html += '</div>\n</div>';
            return html;
        }

        // TAB 点击切换（事件委托）
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('tabbed-label')) {
                const tabSet = e.target.closest('.tabbed-set');
                const tabIndex = e.target.dataset.tab;

                // 切换标签状态
                tabSet.querySelectorAll('.tabbed-label').forEach(label => {
                    label.classList.remove('active');
                });
                e.target.classList.add('active');

                // 切换内容状态
                tabSet.querySelectorAll('.tabbed-panel').forEach(panel => {
                    panel.classList.remove('active');
                    if (panel.dataset.tab === tabIndex) {
                        panel.classList.add('active');
                    }
                });
            }
        });

        if (sidebarToggle) sidebarToggle.onclick = openSidebar;
        if (sidebarCloseEl) sidebarCloseEl.onclick = closeSidebar;
        if (sidebarOverlay) sidebarOverlay.onclick = closeSidebar;

        navItems.forEach(item => {
            item.onclick = (e) => {
                e.preventDefault();
                navigationStack = [];
                navigateTo(item.dataset.page);
            };
        });

        window.onpopstate = handlePopState;
        handlePopState();
    }

    function openSidebar() {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('show');
        updateSidebarLinks();
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('show');
    }

    function extractWikiLinks(content) {
        const links = [];
        const regex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            const file = match[1].trim();
            const text = match[2] ? match[2].trim() : file;
            links.push({ file, text });
        }
        return links;
    }

    function extractHeadings(content) {
        const headings = [];
        const regex = /^## (.+)$/gm;
        let match;
        while ((match = regex.exec(content)) !== null) {
            const text = match[1].trim();
            if (text.length <= 15) {
                headings.push({ text, anchor: text });
            }
        }
        return headings;
    }

    let currentWikiLinks = [];
    let currentHeadings = [];

    function updateSidebarLinks() {
        const names = { health: '健康', fitness: '健身', mind: '心灵', plan: '计划' };

        let html = `<div class="sidebar-section-title">${names[currentPage] || '页面导航'}</div>`;

        if (currentHeadings.length > 0) {
            currentHeadings.forEach(link => {
                html += `<a class="sidebar-link" onclick="goToAnchor('${link.anchor.replace(/'/g, "\\'")}')">
                    <span class="sidebar-link-icon">📑</span>
                    <span class="sidebar-link-text">${link.text}</span>
                    <span class="sidebar-link-arrow">›</span>
                </a>`;
            });
        }

        sidebarContent.innerHTML = html || '<p style="padding:20px;color:#666;text-align:center;">暂无内容</p>';
    }

        if (currentHeadings.length > 0) {
            currentHeadings.forEach(link => {
                html += `<a class="sidebar-link" onclick="goToAnchor('${link.anchor.replace(/'/g, "\\'")}')">
                    <span class="sidebar-link-icon">📑</span>
                    <span class="sidebar-link-text">${link.text}</span>
                    <span class="sidebar-link-arrow">›</span>
                </a>`;
            });
        }

        sidebarContent.innerHTML = html || '<p style="padding:20px;color:#666;text-align:center;">暂无内容</p>';
    }

    // 构建面包屑 HTML
    function buildBreadcrumb() {
        if (navigationStack.length === 0) return '';

        const names = { health: '健康', fitness: '健身', mind: '心灵', plan: '计划' };

        let html = `<div class="breadcrumb">
            <a class="breadcrumb-item" onclick="goHome()">🏠 首页</a>
            <span class="breadcrumb-sep">›</span>
            <a class="breadcrumb-item" onclick="goToMainPage()">${names[currentPage] || currentPage}</a>`;

        navigationStack.forEach((item, i) => {
            const displayName = item.title || item.path.split('/').pop().replace('.md', '');
            const isLast = (i === navigationStack.length - 1);

            html += `<span class="breadcrumb-sep">›</span>`;

            if (isLast) {
                html += `<span class="breadcrumb-current">${displayName}</span>`;
            } else {
                html += `<a class="breadcrumb-item" onclick="goBackToLevel(${i})">${displayName}</a>`;
            }
        });

        html += '</div>';
        return html;
    }

    function wrapTables() {
        contentEl.querySelectorAll('table').forEach(table => {
            if (table.parentElement.classList.contains('table-scroll')) return;
            var wrapper = document.createElement('div');
            wrapper.className = 'table-scroll';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        });
    }

    function renderContent(html) {
        contentEl.innerHTML = html;
        wrapTables();
    }

    function renderContentWithBreadcrumb(breadcrumb, html) {
        contentEl.innerHTML = breadcrumb + html;
        wrapTables();
    }

    // 加载子页面
    window.loadSubPage = async function(name) {
        closeSidebar();
        contentEl.innerHTML = '<div class="loading">加载中...</div>';

        let filePath = name;
        if (!filePath.endsWith('.md')) {
            filePath += '.md';
        }
        if (!filePath.includes('/')) {
            filePath = `${currentPage}/${filePath}`;
        }

        try {
            const res = await fetch(`${CONFIG.contentPath}${filePath}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            let md = await res.text();

            // 保存当前状态到导航栈
            navigationStack.push({
                path: filePath,
                wikiLinks: [...currentWikiLinks],
                headings: [...currentHeadings],
                title: name.replace('.md', '').split('/').pop()
            });

            // 提取新页面的链接和标题
            currentWikiLinks = extractWikiLinks(md);
            currentHeadings = extractHeadings(md);

            // 处理双链
            md = md.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, file, text) => {
                const displayText = text || file;
                const fileName = file.endsWith('.md') ? file : file + '.md';
                return `[${displayText}](javascript:loadSubPage('${fileName}'))`;
            });

            renderContentWithBreadcrumb(breadcrumb, typeof marked !== 'undefined' ? marked.parse(md) : `<pre>${md}</pre>`);
            contentEl.scrollTop = 0;

        } catch (e) {
            const breadcrumb = buildBreadcrumb();
            renderContentWithBreadcrumb(breadcrumb, `<div class="error">
                <h2>📄 内容未找到</h2>
                <p>无法加载 ${filePath}</p>
                <p style="color:#999;font-size:12px;">${e.message}</p>
            </div>`);
        }
    };

    // 返回首页
    window.goHome = function() {
        navigationStack = [];
        navigateTo('health');
    };

    // 返回主页面（fitness/health等）
    window.goToMainPage = function() {
        navigationStack = [];
        loadPage(currentPage);
    };

    // 返回到指定层级
    window.goBackToLevel = async function(level) {
        if (level < 0) {
            goHome();
            return;
        }

        // 保留到指定层级
        const target = navigationStack[level];
        navigationStack = navigationStack.slice(0, level);

        // 恢复该层级的状态
        currentWikiLinks = target.wikiLinks;
        currentHeadings = target.headings;

        try {
            const res = await fetch(`${CONFIG.contentPath}${target.path}`);
            if (!res.ok) throw new Error(res.status);
            let md = await res.text();

            md = md.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, file, text) => {
                const displayText = text || file;
                const fileName = file.endsWith('.md') ? file : file + '.md';
                return `[${displayText}](javascript:loadSubPage('${fileName}'))`;
            });

            renderContentWithBreadcrumb(breadcrumb, typeof marked !== 'undefined' ? marked.parse(md) : `<pre>${md}</pre>`);
            contentEl.scrollTop = 0;

        } catch (e) {
            renderContent(`<div class="error"><h2>加载失败</h2><a onclick="goHome()">← 返回首页</a></div>`);
        }
    };

    // 返回上一级
    window.goBack = function() {
        if (navigationStack.length === 0) {
            goToMainPage();
        } else {
            goBackToLevel(navigationStack.length - 2);
        }
    };

    window.goToAnchor = function(text) {
        closeSidebar();
        const hs = contentEl.querySelectorAll('h1,h2,h3');
        for (const h of hs) {
            if (h.textContent.includes(text)) {
                h.scrollIntoView({ behavior: 'smooth' });
                h.style.background = 'rgba(67,160,71,0.2)';
                setTimeout(() => h.style.background = '', 2000);
                break;
            }
        }
    };

    function handlePopState() {
        const page = getUrlParam('page') || CONFIG.defaultPage;
        currentPage = CONFIG.pages.includes(page) ? page : CONFIG.defaultPage;
        navigationStack = [];
        updateNavHighlight(currentPage);
        loadPage(currentPage);
    }

    function navigateTo(page) {
        if (currentPage === page && contentEl.dataset.loaded === page) return;
        currentPage = page;
        updateNavHighlight(page);
        setUrlParam('page', page);
        loadPage(page);
    }

    function updateNavHighlight(page) {
        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
    }

    async function loadPage(page) {
        contentEl.innerHTML = '<div class="loading">加载中...</div>';
        contentEl.dataset.loaded = '';

        try {
            const res = await fetch(`${CONFIG.contentPath}${page}.md`);
            if (!res.ok) throw new Error(res.status);
            let md = await res.text();

            currentWikiLinks = extractWikiLinks(md);
            currentHeadings = extractHeadings(md);

            md = md.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, file, text) => {
                const displayText = text || file;
                const fileName = file.endsWith('.md') ? file : file + '.md';
                return `[${displayText}](javascript:loadSubPage('${fileName}'))`;
            });

            renderContent(typeof marked !== 'undefined' ? marked.parse(md) : `<pre>${md}</pre>`);
            contentEl.dataset.loaded = page;
            contentEl.scrollTop = 0;

            // 更新侧边栏链接
            updateSidebarLinks();

        } catch (e) {
            contentEl.innerHTML = `<div class="error"><h2>📄 内容未找到</h2><p>无法加载 ${page}.md</p></div>`;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
