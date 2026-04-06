/**
 * 生活管理 H5 应用
 * 路由 + Markdown 渲染
 */

(function() {
    'use strict';

    // ===== 配置 =====
    const CONFIG = {
        contentPath: 'content/',
        defaultPage: 'health',
        pages: ['health', 'fitness', 'mind', 'plan', 'about']
    };

    // ===== 当前状态 =====
    let currentPage = CONFIG.defaultPage;

    // ===== DOM 元素 =====
    const contentEl = document.getElementById('content');
    const navItems = document.querySelectorAll('.nav-item');

    // ===== 初始化 =====
    function init() {
        // 配置 marked 选项
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                breaks: true,        // 支持 GitHub 风格换行
                gfm: true,           // GitHub 风格 Markdown
                headerIds: false,    // 不生成 header id
                mangle: false        // 不混淆邮箱
            });
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

    // ===== 路由处理 =====
    function handleHashChange() {
        const hash = window.location.hash.slice(1) || CONFIG.defaultPage;
        const page = CONFIG.pages.includes(hash) ? hash : CONFIG.defaultPage;
        navigateTo(page);
    }

    function navigateTo(page) {
        if (currentPage === page && contentEl.dataset.loaded === page) {
            return; // 已加载，跳过
        }

        currentPage = page;

        // 更新导航高亮
        updateNavHighlight(page);

        // 更新 URL
        history.pushState(null, '', `#${page}`);

        // 加载内容
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

        // 渲染 Markdown
        contentEl.innerHTML = marked.parse(markdown);

        // 处理可折叠卡片中的 HTML
        processCollapsibleCards();

        // 滚动到顶部
        contentEl.scrollTop = 0;
    }

    // ===== 可折叠卡片处理 =====
    function processCollapsibleCards() {
        // 找到所有可折叠卡片（通过 class 标记）
        const cards = contentEl.querySelectorAll('.collapsible-card');

        cards.forEach(card => {
            const header = card.querySelector('.collapsible-header');
            if (header) {
                // 绑定点击事件
                header.addEventListener('click', function() {
                    card.classList.toggle('open');
                });

                // 默认展开第一个卡片
                if (card === cards[0]) {
                    card.classList.add('open');
                }
            }
        });
    }

    // 全局函数供 onclick 使用
    window.toggleCollapsible = function(header) {
        const card = header.closest('.collapsible-card');
        if (card) {
            card.classList.toggle('open');
        }
    };

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
