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

    // ===== 状态 =====
    let currentPage = CONFIG.defaultPage;
    let contentEl, navItems, sidebar, sidebarOverlay, sidebarToggle, sidebarClose, sidebarContent;

    // ===== 工具函数 =====
    function getUrlParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    function setUrlParam(param, value) {
        const url = new URL(window.location.href);
        url.searchParams.set(param, value);
        window.history.pushState({}, '', url.toString());
    }

    // ===== 初始化 =====
    function init() {
        contentEl = document.getElementById('content');
        navItems = document.querySelectorAll('.nav-item');
        sidebar = document.getElementById('sidebar');
        sidebarOverlay = document.getElementById('sidebarOverlay');
        sidebarToggle = document.getElementById('sidebarToggle');
        sidebarClose = document.getElementById('sidebarClose');
        sidebarContent = document.getElementById('sidebarContent');

        // 配置 marked
        if (typeof marked !== 'undefined') {
            marked.setOptions({ breaks: true, gfm: true });
        }

        // 侧边栏事件
        if (sidebarToggle) sidebarToggle.addEventListener('click', openSidebar);
        if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
        if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

        // 导航点击
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo(item.dataset.page);
            });
        });

        // 浏览器前进后退
        window.addEventListener('popstate', handlePopState);

        // 初始加载
        handlePopState();
    }

    // ===== 侧边栏 =====
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
        const pageNames = { health: '健康', fitness: '健身', mind: '心灵', plan: '计划' };

        if (links.length === 0) {
            sidebarContent.innerHTML = `<div class="sidebar-section">
                <div class="sidebar-section-title">${pageNames[currentPage] || '当前模块'}</div>
                <p style="padding: 16px; color: var(--text-light); text-align: center;">暂无快捷链接</p>
            </div>`;
            return;
        }

        let html = `<div class="sidebar-section">
            <div class="sidebar-section-title">${pageNames[currentPage] || '快捷链接'}</div>`;

        links.forEach(link => {
            if (link.url) {
                html += `<a href="${link.url}" class="sidebar-link">
                    <span class="sidebar-link-icon">${link.icon}</span>
                    <span class="sidebar-link-text">${link.text}</span>
                    <span class="sidebar-link-arrow">›</span>
                </a>`;
            } else if (link.anchor) {
                html += `<a href="javascript:void(0)" class="sidebar-link" onclick="scrollToAnchor('${link.anchor}')">
                    <span class="sidebar-link-icon">${link.icon}</span>
                    <span class="sidebar-link-text">${link.text}</span>
                    <span class="sidebar-link-arrow">›</span>
                </a>`;
            }
        });

        html += '</div>';
        sidebarContent.innerHTML = html;
    }

    // 全局滚动函数
    window.scrollToAnchor = function(anchorText) {
        closeSidebar();
        const headings = contentEl.querySelectorAll('h1, h2, h3');
        for (const h of headings) {
            if (h.textContent.includes(anchorText)) {
                h.scrollIntoView({ behavior: 'smooth', block: 'start' });
                h.style.background = 'rgba(76, 175, 80, 0.2)';
                setTimeout(() => { h.style.background = ''; }, 2000);
                break;
            }
        }
    };

    // ===== 路由 =====
    function handlePopState() {
        const page = getUrlParam('page') || CONFIG.defaultPage;
        const validPage = CONFIG.pages.includes(page) ? page : CONFIG.defaultPage;
        currentPage = validPage;
        updateNavHighlight(validPage);
        loadContent(validPage);
    }

    function navigateTo(page) {
        if (currentPage === page && contentEl.dataset.loaded === page) return;
        currentPage = page;
        updateNavHighlight(page);
        setUrlParam('page', page);
        loadContent(page);
    }

    function updateNavHighlight(page) {
        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
    }

    // ===== 内容加载 =====
    async function loadContent(page) {
        contentEl.innerHTML = '<div class="loading">加载中...</div>';
        contentEl.dataset.loaded = '';

        try {
            const response = await fetch(`${CONFIG.contentPath}${page}.md`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const markdown = await response.text();
            renderContent(markdown);
            contentEl.dataset.loaded = page;
        } catch (error) {
            contentEl.innerHTML = `<div class="error">
                <h2>📄 内容未找到</h2>
                <p>无法加载 <code>${page}.md</code></p>
                <p>${error.message}</p>
            </div>`;
        }
    }

    function renderContent(markdown) {
        if (typeof marked === 'undefined') {
            contentEl.innerHTML = `<pre>${markdown}</pre>`;
            return;
        }
        contentEl.innerHTML = marked.parse(markdown);
        contentEl.scrollTop = 0;
    }

    // ===== 启动 =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
