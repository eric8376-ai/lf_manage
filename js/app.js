/**
 * 生活管理 H5 应用
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
                { icon: '💪', text: '胸部训练', subpage: 'chest' },
                { icon: '🔙', text: '背部训练', subpage: 'back' },
                { icon: '🦵', text: '腿部训练', subpage: 'legs' },
                { icon: '🤷', text: '肩部训练', subpage: 'shoulder' },
                { icon: '🎯', text: '核心训练', subpage: 'core' },
                { icon: '🧘', text: '拉伸放松', subpage: 'stretch' },
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
    let contentEl, navItems, sidebar, sidebarOverlay, sidebarToggle, sidebarCloseEl, sidebarContent;

    // ===== 工具函数 =====
    function getUrlParam(param) {
        return new URLSearchParams(window.location.search).get(param);
    }

    function setUrlParam(param, value) {
        const url = new URL(window.location.href);
        url.searchParams.set(param, value);
        history.pushState({}, '', url);
    }

    // ===== 初始化 =====
    function init() {
        contentEl = document.getElementById('content');
        navItems = document.querySelectorAll('.nav-item');
        sidebar = document.getElementById('sidebar');
        sidebarOverlay = document.getElementById('sidebarOverlay');
        sidebarToggle = document.getElementById('sidebarToggle');
        sidebarCloseEl = document.getElementById('sidebarClose');
        sidebarContent = document.getElementById('sidebarContent');

        // 配置 marked
        if (typeof marked !== 'undefined') {
            marked.setOptions({ breaks: true, gfm: true });
        }

        // 侧边栏事件
        if (sidebarToggle) sidebarToggle.onclick = openSidebar;
        if (sidebarCloseEl) sidebarCloseEl.onclick = closeSidebar;
        if (sidebarOverlay) sidebarOverlay.onclick = closeSidebar;

        // 导航点击
        navItems.forEach(item => {
            item.onclick = (e) => {
                e.preventDefault();
                navigateTo(item.dataset.page);
            };
        });

        // 浏览器前进后退
        window.onpopstate = handlePopState;

        // 初始加载
        handlePopState();
    }

    // ===== 侧边栏 =====
    function openSidebar() {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('show');
        updateSidebarLinks();
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('show');
    }

    function updateSidebarLinks() {
        const links = CONFIG.sidebarLinks[currentPage] || [];
        const names = { health: '健康', fitness: '健身', mind: '心灵', plan: '计划' };

        if (!links.length) {
            sidebarContent.innerHTML = `<p style="padding:20px;color:#666;text-align:center;">暂无快捷链接</p>`;
            return;
        }

        let html = `<div class="sidebar-section-title">${names[currentPage] || '快捷链接'}</div>`;
        links.forEach(link => {
            if (link.subpage) {
                html += `<a class="sidebar-link" onclick="loadSubPage('${link.subpage}')">
                    <span class="sidebar-link-icon">${link.icon}</span>
                    <span class="sidebar-link-text">${link.text}</span>
                    <span class="sidebar-link-arrow">›</span>
                </a>`;
            } else if (link.anchor) {
                html += `<a class="sidebar-link" onclick="goToAnchor('${link.anchor}')">
                    <span class="sidebar-link-icon">${link.icon}</span>
                    <span class="sidebar-link-text">${link.text}</span>
                    <span class="sidebar-link-arrow">›</span>
                </a>`;
            }
        });
        sidebarContent.innerHTML = html;
    }

    // 全局函数：加载子页面
    window.loadSubPage = async function(name) {
        closeSidebar();
        contentEl.innerHTML = '<div class="loading">加载中...</div>';

        try {
            const res = await fetch(`${CONFIG.contentPath}fitness/${name}.md`);
            if (!res.ok) throw new Error(res.status);
            const md = await res.text();

            // 添加返回按钮
            const backBtn = `<a class="back-link" onclick="goBack()">← 返回健身模块</a>`;
            contentEl.innerHTML = backBtn + (typeof marked !== 'undefined' ? marked.parse(md) : `<pre>${md}</pre>`);
        } catch (e) {
            contentEl.innerHTML = `<div class="error"><h2>内容未找到</h2><p>无法加载 fitness/${name}.md</p></div>`;
        }
    };

    window.goBack = function() {
        navigateTo('fitness');
    };

    window.goToAnchor = function(text) {
        closeSidebar();
        const hs = contentEl.querySelectorAll('h1,h2,h3');
        for (const h of hs) {
            if (h.textContent.includes(text)) {
                h.scrollIntoView({ behavior: 'smooth' });
                h.style.background = 'rgba(76,175,80,0.2)';
                setTimeout(() => h.style.background = '', 2000);
                break;
            }
        }
    };

    // ===== 路由 =====
    function handlePopState() {
        const page = getUrlParam('page') || CONFIG.defaultPage;
        currentPage = CONFIG.pages.includes(page) ? page : CONFIG.defaultPage;
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

    // ===== 内容加载 =====
    async function loadPage(page) {
        contentEl.innerHTML = '<div class="loading">加载中...</div>';
        contentEl.dataset.loaded = '';

        try {
            const res = await fetch(`${CONFIG.contentPath}${page}.md`);
            if (!res.ok) throw new Error(res.status);
            const md = await res.text();
            contentEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(md) : `<pre>${md}</pre>`;
            contentEl.dataset.loaded = page;
            contentEl.scrollTop = 0;
        } catch (e) {
            contentEl.innerHTML = `<div class="error"><h2>📄 内容未找到</h2><p>无法加载 ${page}.md</p></div>`;
        }
    }

    // ===== 启动 =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
