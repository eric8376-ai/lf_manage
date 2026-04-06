/**
 * 生活管理 H5 应用
 * 路由 + Markdown 渲染 + 侧边栏
 */

(function() {
    'use strict';

    // ===== 配置 =====
    const CONFIG = {
        contentPath: 'content/',
        defaultPage: 'health',
        pages: ['health', 'fitness', 'mind', 'plan', 'about'],
        // 侧边栏链接配置
        sidebarLinks: {
            health: [
                { icon: '📋', text: '健康原则', anchor: '健康生活原则' },
                { icon: '✅', text: '日常清单', anchor: '日常健康清单' },
            ],
            fitness: [
                { icon: '💪', text: '胸部训练', url: 'content/fitness/chest.html' },
                { icon: '🔙', text: '背部训练', url: 'content/fitness/back.html' },
                { icon: '🦵', text: '腿部训练', url: 'content/fitness/legs.html' },
                { icon: '🤷', text: '肩部训练', url: 'content/fitness/shoulder.html' },
                { icon: '🎯', text: '核心训练', url: 'content/fitness/core.html' },
                { icon: '🧘', text: '拉伸放松', url: 'content/fitness/stretch.html' },
            ],
            mind: [
                { icon: '🧘', text: '冥想练习', anchor: '冥想练习' },
                { icon: '💭', text: '情绪管理', anchor: '情绪管理' },
            ],
            plan: [
                { icon: '🎯', text: '年度目标', anchor: '年度目标' },
                { icon: '📅', text: '周计划', anchor: '周计划模板' },
            ]
        }
    };

    // ===== 当前状态 =====
    let currentPage = CONFIG.defaultPage;

    // ===== DOM 元素 =====
    let contentEl, navItems, sidebar, sidebarOverlay, sidebarToggle, sidebarClose, sidebarContent;

    // ===== 初始化 =====
    function init() {
        // 获取 DOM 元素
        contentEl = document.getElementById('content');
        navItems = document.querySelectorAll('.nav-item');
        sidebar = document.getElementById('sidebar');
        sidebarOverlay = document.getElementById('sidebarOverlay');
        sidebarToggle = document.getElementById('sidebarToggle');
        sidebarClose = document.getElementById('sidebarClose');
        sidebarContent = document.getElementById('sidebarContent');

        // 配置 marked 选项
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                breaks: true,
                gfm: true,
                headerIds: true,
                mangle: false
            });
        }

        // 侧边栏事件
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', openSidebar);
        }
        if (sidebarClose) {
            sidebarClose.addEventListener('click', closeSidebar);
        }
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', closeSidebar);
        }

        // 监听 hash 变化
        window.addEventListener('hashchange', handleHashChange);

        // 监听导航点击
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                navigateTo(page);
            });
        });

        // 初始加载
        handleHashChange();
    }

    // ===== 侧边栏控制 =====
    function openSidebar() {
        if (sidebar && sidebarOverlay) {
            sidebar.classList.add('open');
            sidebarOverlay.classList.add('show');
            updateSidebarContent();
        }
    }

    function closeSidebar() {
        if (sidebar && sidebarOverlay) {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('show');
        }
    }

    function updateSidebarContent() {
        if (!sidebarContent) return;

        const links = CONFIG.sidebarLinks[currentPage] || [];
        const pageNames = {
            health: '健康',
            fitness: '健身',
            mind: '心灵',
            plan: '计划'
        };

        if (links.length === 0) {
            sidebarContent.innerHTML = `
                <div class="sidebar-section">
                    <div class="sidebar-section-title">${pageNames[currentPage] || '当前模块'}</div>
                    <p style="padding: 16px; color: var(--text-light); text-align: center;">
                        暂无快捷链接
                    </p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="sidebar-section">
                <div class="sidebar-section-title">${pageNames[currentPage] || '快捷链接'}</div>
        `;

        links.forEach(link => {
            if (link.url) {
                html += `
                    <a href="${link.url}" class="sidebar-link">
                        <span class="sidebar-link-icon">${link.icon}</span>
                        <span class="sidebar-link-text">${link.text}</span>
                        <span class="sidebar-link-arrow">›</span>
                    </a>
                `;
            } else if (link.anchor) {
                html += `
                    <a href="javascript:void(0)" class="sidebar-link" onclick="scrollToAnchor('${link.anchor}')">
                        <span class="sidebar-link-icon">${link.icon}</span>
                        <span class="sidebar-link-text">${link.text}</span>
                        <span class="sidebar-link-arrow">›</span>
                    </a>
                `;
            }
        });

        html += '</div>';
        sidebarContent.innerHTML = html;
    }

    // 全局滚动函数
    window.scrollToAnchor = function(anchorText) {
        closeSidebar();
        // 查找包含该文本的标题
        const headings = contentEl.querySelectorAll('h1, h2, h3');
        for (const h of headings) {
            if (h.textContent.includes(anchorText)) {
                h.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // 高亮效果
                h.style.background = 'rgba(76, 175, 80, 0.2)';
                setTimeout(() => { h.style.background = ''; }, 2000);
                break;
            }
        }
    };

    // ===== 路由处理 =====
    function handleHashChange() {
        const hash = window.location.hash.slice(1) || CONFIG.defaultPage;
        const page = CONFIG.pages.includes(hash) ? hash : CONFIG.defaultPage;
        navigateTo(page);
    }

    function navigateTo(page) {
        if (currentPage === page && contentEl.dataset.loaded === page) {
            return;
        }

        currentPage = page;
        updateNavHighlight(page);
        history.pushState(null, '', `#${page}`);
        loadContent(page);
    }

    function updateNavHighlight(page) {
        navItems.forEach(item => {
            if (item.dataset.page === page) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // ===== 内容加载 =====
    async function loadContent(page) {
        showLoading();

        try {
            const response = await fetch(`${CONFIG.contentPath}${page}.md`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const markdown = await response.text();
            renderContent(markdown, page);
            contentEl.dataset.loaded = page;

        } catch (error) {
            showError(page, error);
        }
    }

    function showLoading() {
        contentEl.innerHTML = '<div class="loading">加载中...</div>';
        contentEl.dataset.loaded = '';
    }

    function showError(page, error) {
        contentEl.innerHTML = `
            <div class="error">
                <h2>📄 内容未找到</h2>
                <p>无法加载 <code>${page}.md</code></p>
                <p class="error-detail">${error.message}</p>
                <hr>
                <p><strong>提示：</strong>请确保文件存在并已推送到 GitHub</p>
            </div>
        `;
        contentEl.dataset.loaded = '';
    }

    function renderContent(markdown, page) {
        if (typeof marked === 'undefined') {
            contentEl.innerHTML = `
                <div class="error">
                    <h2>⚠️ 解析器未加载</h2>
                    <p>marked.js 未正确加载</p>
                    <pre>${escapeHtml(markdown)}</pre>
                </div>
            `;
            return;
        }

        contentEl.innerHTML = marked.parse(markdown);
        contentEl.scrollTop = 0;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ===== 启动 =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
