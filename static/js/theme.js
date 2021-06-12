class Theme {
    constructor() {
        this.config = window.config;
    }

    initSearch() {
        const searchConfig = this.config.search;

        const maxResultLength = searchConfig.maxResultLength ? searchConfig.maxResultLength : 10;
        const snippetLength = searchConfig.snippetLength ? searchConfig.snippetLength : 50;
        const highlightTag = searchConfig.highlightTag ? searchConfig.highlightTag : 'em';

        const $searchInput = document.getElementById(`search-input-desktop`);
        const $searchToggle = document.getElementById(`search-toggle-desktop`);
        const $searchLoading = document.getElementById(`search-loading-desktop`);
        const $searchClear = document.getElementById(`search-clear-desktop`);

        this._searchDesktopOnce = true;
        $searchToggle.addEventListener('click', () => {
            document.body.classList.add('blur');
            $header.classList.add('open');
            $searchInput.focus();
        }, false);
        $searchClear.addEventListener('click', () => {
            $searchClear.style.display = 'none';
            this._searchDesktop && this._searchDesktop.autocomplete.setVal('');
        }, false);
        this._searchDesktopOnClickMask = this._searchDesktopOnClickMask || (() => {
            $header.classList.remove('open');
            $searchLoading.style.display = 'none';
            $searchClear.style.display = 'none';
            this._searchDesktop && this._searchDesktop.autocomplete.setVal('');
        });
        // this.clickMaskEventSet.add(this._searchDesktopOnClickMask);

        $searchInput.addEventListener('input', () => {
            if ($searchInput.value === '') $searchClear.style.display = 'none';
            else $searchClear.style.display = 'inline';
        }, false);

        const initAutosearch = () => {
            const autosearch = autocomplete(`#search-input-desktop`, {
                hint: false,
                autoselect: true,
                dropdownMenuContainer: `#search-dropdown-desktop`,
                clearOnSelected: true,
                cssClasses: { noPrefix: true,  },
                debug: true,
            }, {
                name: 'search',
                source: (query, callback) => {
                    $searchLoading.style.display = 'inline';
                    $searchClear.style.display = 'none';
                    const finish = (results) => {
                        $searchLoading.style.display = 'none';
                        $searchClear.style.display = 'inline';
                        callback(results);
                    };

                    this._algoliaIndex = this._algoliaIndex || algoliasearch(searchConfig.algoliaAppID, searchConfig.algoliaSearchKey).initIndex(searchConfig.algoliaIndex);
                    this._algoliaIndex
                        .search(query, {
                            offset: 0,
                            length: maxResultLength * 8,
                            attributesToHighlight: ['title'],
                            attributesToSnippet: [`content:${snippetLength}`],
                            highlightPreTag: `<${highlightTag}>`,
                            highlightPostTag: `</${highlightTag}>`,
                        })
                        .then(({ hits }) => {
                            const results = {};
                            hits.forEach(({ uri, date, _highlightResult: { title }, _snippetResult: { content } }) => {
                                if (results[uri] && results[uri].context.length > content.value) return;
                                results[uri] = {
                                    uri: uri,
                                    title: title.value,
                                    date: date,
                                    context: content.value,
                                };
                            });
                            finish(Object.values(results).slice(0, maxResultLength));
                        })
                        .catch(err => {
                            console.error(err);
                            finish([]);
                        });
                },
                templates: {
                    suggestion: ({ title, date, context }) => `<div><span class="suggestion-title">${title}</span><span class="suggestion-date">${date}</span></div><div class="suggestion-context">${context}</div>`,
                    empty: ({ query }) => `<div class="search-empty">${searchConfig.noResultsFound}: <span class="search-query">"${query}"</span></div>`,
                    footer: ({ }) => {
                        const { searchType, icon, href } = searchConfig.type === 'algolia' ? {
                            searchType: 'algolia',
                            icon: '<i class="fab fa-algolia fa-fw"></i>',
                            href: 'https://www.algolia.com/',
                        } : {
                            searchType: 'Lunr.js',
                            icon: '',
                            href: 'https://lunrjs.com/',
                        };
                        return `<div class="search-footer">Search by <a href="${href}" rel="noopener noreffer" target="_blank">${icon} ${searchType}</a></div>`;
                    },
                },
            })
            autosearch.on('autocomplete:selected', (_event, suggestion, _dataset, _context) => {
                window.location.assign(suggestion.uri);
            });
            // if (isMobile) this._searchMobile = autosearch;
            this._searchDesktop = autosearch;            
            $('#searchModal').on('hidden.bs.modal', function (e) {
                $searchClear.dispatchEvent(new Event('click'));
            })
        }

        initAutosearch()
    }

    init() {
        try {
            this.initSearch();
        } catch (err) {
            console.error(err);
        }

        window.setTimeout(() => {
        }, 100);
    }
}

const themeInit = () => {
    const theme = new Theme();
    theme.init();
};

if (document.readyState !== 'loading') {
    themeInit();
} else {
    document.addEventListener('DOMContentLoaded', themeInit, false);
}
