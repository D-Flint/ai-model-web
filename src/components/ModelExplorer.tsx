import { comparablePrice, formatPrice, rateLabel } from '../lib/apiPricing';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Plus,
  Check,
  X,
  Search,
  LayoutGrid,
  Table as TableIcon,
  List,
  SlidersHorizontal,
} from 'lucide-react';
import ModelCard from './ModelCard';
import { ProviderLogo } from './ProviderLogo';
import { ModelDataSources } from './ModelDataSources';
import type { CatalogModel } from '../lib/catalogSchema';
import { getModelDetailSources } from '../lib/modelDetailSources';
import {
  selectionFromSearch,
  getMaxReasoningEffort,
  getSpeedTokensPerSec,
  getSpeedDisplayValue,
  contextSize,
  sortLeaderboardRows,
  type LeaderboardMetricKey,
} from '../lib/decision';
import livebenchRows from '../data/livebenchData.json';
import { CANONICAL_MODELS } from '../data/canonicalModels';
import { defaultAliasResolver } from '../pipeline/aliasResolver';
import { getModalitiesLabel } from '../lib/modalities';

export type LeaderboardColumnKey =
  | 'overall'
  | 'reasoning'
  | 'coding'
  | 'agentic'
  | 'mathematics'
  | 'dataAnalysis'
  | 'language'
  | 'instructionFollowing'
  | 'cost'
  | 'speed';

interface ColumnDef {
  key: LeaderboardColumnKey;
  label: string;
  align: 'left' | 'center' | 'right';
  defaultVisible: boolean;
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'overall', label: 'OVERALL', align: 'center', defaultVisible: true },
  {
    key: 'reasoning',
    label: 'REASONING',
    align: 'center',
    defaultVisible: true,
  },
  { key: 'coding', label: 'CODING', align: 'center', defaultVisible: true },
  {
    key: 'agentic',
    label: 'AGENTIC CODING',
    align: 'center',
    defaultVisible: true,
  },
  {
    key: 'mathematics',
    label: 'MATHEMATICS',
    align: 'center',
    defaultVisible: true,
  },
  {
    key: 'dataAnalysis',
    label: 'DATA ANALYSIS',
    align: 'center',
    defaultVisible: true,
  },
  {
    key: 'language',
    label: 'LANGUAGE',
    align: 'center',
    defaultVisible: true,
  },
  {
    key: 'instructionFollowing',
    label: 'INSTRUCTION FOLLOWING',
    align: 'center',
    defaultVisible: true,
  },
  {
    key: 'cost',
    label: 'INPUT / 1M TOKENS',
    align: 'right',
    defaultVisible: true,
  },
  {
    key: 'speed',
    label: 'SPEED (TOK/S)',
    align: 'center',
    defaultVisible: true,
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All', sortCol: 'releaseDate' as const },
  { id: 'reasoning', label: 'Reasoning', sortCol: 'reasoning' as const },
  { id: 'coding', label: 'Coding', sortCol: 'coding' as const },
  { id: 'agentic', label: 'Agentic Coding', sortCol: 'agentic' as const },
  { id: 'mathematics', label: 'Mathematics', sortCol: 'mathematics' as const },
  {
    id: 'dataAnalysis',
    label: 'Data Analysis',
    sortCol: 'dataAnalysis' as const,
  },
  { id: 'language', label: 'Language', sortCol: 'language' as const },
  {
    id: 'instructionFollowing',
    label: 'Instruction Following',
    sortCol: 'instructionFollowing' as const,
  },
] as const;

export default function ModelExplorer({ models }: { models: CatalogModel[] }) {
  const [query, setQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState('');
  const [openWeightsOnly, setOpenWeightsOnly] = useState(false);
  const [includeFinetunes, setIncludeFinetunes] = useState(false);
  const [showOrg, setShowOrg] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<
    LeaderboardColumnKey | 'name' | 'releaseDate'
  >('releaseDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);

  function getDisplayPriceLabel(
    model: CatalogModel,
    key: 'input' | 'output',
  ): string {
    const label = rateLabel(model, key);
    if (label !== 'Unavailable') return label;
    const fallbackVal =
      key === 'input' ? model.pricing?.input : model.pricing?.output;
    return fallbackVal != null ? formatPrice(fallbackVal) : 'Unavailable';
  }

  const [showCompareMenu, setShowCompareMenu] = useState(false);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [mobileModalTab, setMobileModalTab] = useState<
    'categories' | 'columns'
  >('categories');
  const [isMobileView, setIsMobileView] = useState(false);
  const [tempCategory, setTempCategory] = useState<string>('all');
  const [tempVisibleColumns, setTempVisibleColumns] = useState<
    Record<LeaderboardColumnKey, boolean>
  >(() => {
    const init: Record<string, boolean> = {};
    for (const c of ALL_COLUMNS) {
      init[c.key] = c.defaultVisible;
    }
    return init as Record<LeaderboardColumnKey, boolean>;
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const compareMenuRef = useRef<HTMLDivElement>(null);
  const columnsMenuRef = useRef<HTMLDivElement>(null);
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const [tableMaxHeight, setTableMaxHeight] = useState<number | undefined>(
    undefined,
  );

  const [visibleColumns, setVisibleColumns] = useState<
    Record<LeaderboardColumnKey, boolean>
  >(() => {
    const init: Record<string, boolean> = {};
    for (const c of ALL_COLUMNS) {
      init[c.key] = c.defaultVisible;
    }
    return init as Record<LeaderboardColumnKey, boolean>;
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('q')) setQuery(params.get('q')!);
    setSelectedSlugs(selectionFromSearch(location.search, models));
  }, [models]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        compareMenuRef.current &&
        !compareMenuRef.current.contains(event.target as Node)
      ) {
        setShowCompareMenu(false);
      }
      if (
        columnsMenuRef.current &&
        !columnsMenuRef.current.contains(event.target as Node)
      ) {
        setShowColumnsMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const organizations = useMemo(() => {
    return [...new Set(models.map((m) => m.provider))].sort();
  }, [models]);

  const canonicalBySlug = useMemo(() => {
    const map = new Map<string, (typeof CANONICAL_MODELS)[0]>();
    for (const c of CANONICAL_MODELS) {
      map.set(c.slug.toLowerCase(), c);
      map.set(c.slug.toLowerCase().replace(/[^a-z0-9]/g, ''), c);
    }
    return map;
  }, []);

  const livebenchMap = useMemo(() => {
    const map = new Map<string, (typeof livebenchRows)[0]>();
    for (const r of livebenchRows) {
      map.set(r.model.toLowerCase(), r);
      const stripped = r.model.toLowerCase().replace(/[^a-z0-9]/g, '');
      map.set(stripped, r);
      const canonical = defaultAliasResolver.resolve('livebench', r.model);
      if (canonical) map.set(`canonical:${canonical.slug}`, r);
    }
    return map;
  }, []);

  const processedModels = useMemo(() => {
    return models.map((model) => {
      const maxEffort = getMaxReasoningEffort(model);

      const effortLabel =
        maxEffort === 'none'
          ? null
          : maxEffort === 'fixed'
            ? 'Fixed CoT'
            : maxEffort === 'max'
              ? 'Max Effort'
              : maxEffort === 'high'
                ? 'High Effort'
                : maxEffort === 'medium'
                  ? 'Medium Effort'
                  : 'Low Effort';
      const displayName = effortLabel
        ? `${model.name} ${effortLabel}`
        : model.name;

      // API pricing fallback: tiered apiPricing or verified official-provider pricing
      const inputPrice = comparablePrice(model) ?? model.pricing?.input ?? null;

      const slugLower = model.slug.toLowerCase();
      const slugStripped = slugLower.replace(/[^a-z0-9]/g, '');
      const canon =
        canonicalBySlug.get(slugLower) || canonicalBySlug.get(slugStripped);

      let lbRow =
        livebenchMap.get(slugLower) ||
        livebenchMap.get(slugStripped) ||
        livebenchMap.get(`canonical:${model.slug}`);
      if (!lbRow && canon?.livebenchAliases) {
        for (const alias of canon.livebenchAliases) {
          const matched =
            livebenchMap.get(alias.toLowerCase()) ||
            livebenchMap.get(alias.toLowerCase().replace(/[^a-z0-9]/g, ''));
          if (matched) {
            lbRow = matched;
            break;
          }
        }
      }

      // Leaderboard capability scores strictly from the single LiveBench release.
      // Missing benchmark values remain null (rendered as '—').
      const reasoningVal = lbRow?.reasoning ?? null;
      const codingVal = lbRow?.coding ?? null;
      const mathVal = lbRow?.math ?? null;
      const dataVal = lbRow?.data_analysis ?? null;
      const instVal = lbRow?.instruction_following ?? null;
      const langVal = lbRow?.language ?? null;
      const overallVal = lbRow ? lbRow.global_average : null;
      const speedDisplayValue = getSpeedDisplayValue(model);
      const speedLabel = speedDisplayValue
        ? `${speedDisplayValue} tok/s`
        : null;
      const hasBenchmarkScores = [
        overallVal,
        reasoningVal,
        codingVal,
        lbRow?.agentic_coding ?? null,
        mathVal,
        dataVal,
        langVal,
        instVal,
      ].some((value) => value !== null);
      const detailSources = getModelDetailSources(model, {
        hasBenchmarkScores,
        hasSpeed: speedDisplayValue !== null,
      });

      return {
        model,
        maxEffort,
        effortLabel,
        displayName,
        releaseDate: model.facts.releaseDate,
        isOpenWeights: Boolean(model.facts.openWeights),
        scores: {
          overall: overallVal,
          reasoning: reasoningVal,
          coding: codingVal,
          agentic: lbRow?.agentic_coding ?? null,
          mathematics: mathVal,
          dataAnalysis: dataVal,
          language: langVal,
          instructionFollowing: instVal,
          speed: getSpeedTokensPerSec(model) || null,
          cost: inputPrice,
        } as Record<LeaderboardMetricKey, number | null>,
        inputPrice,
        speedLabel,
        detailSources,
      };
    });
  }, [models, livebenchMap, canonicalBySlug]);

  const filteredRows = useMemo(() => {
    return processedModels.filter((row) => {
      const q = query.toLowerCase().trim();
      if (q) {
        const matchText =
          `${row.model.name} ${row.displayName} ${row.model.provider} ${row.model.tags.join(' ')}`.toLowerCase();
        if (!matchText.includes(q)) return false;
      }
      if (openWeightsOnly && !row.isOpenWeights) {
        return false;
      }
      if (selectedOrg && row.model.provider !== selectedOrg) {
        return false;
      }
      return true;
    });
  }, [processedModels, query, openWeightsOnly, selectedOrg]);

  const sortedRows = useMemo(() => {
    return sortLeaderboardRows(filteredRows, sortColumn, sortDirection);
  }, [filteredRows, sortColumn, sortDirection]);

  useEffect(() => {
    if (
      sortedRows.length > 25 &&
      tableWrapperRef.current &&
      viewMode === 'table'
    ) {
      const updateMaxHeight = () => {
        if (!tableWrapperRef.current) return;
        const thead = tableWrapperRef.current.querySelector('thead');
        const headerHeight = thead ? thead.offsetHeight : 54;
        const firstRow =
          tableWrapperRef.current.querySelector<HTMLTableRowElement>(
            'tbody tr.leaderboard-row',
          );
        const rowHeight = firstRow ? firstRow.offsetHeight : 47;
        // Up to 25 models visible at a time
        setTableMaxHeight(headerHeight + 25 * rowHeight);
      };

      updateMaxHeight();
      window.addEventListener('resize', updateMaxHeight);
      return () => window.removeEventListener('resize', updateMaxHeight);
    } else {
      setTableMaxHeight(undefined);
    }
  }, [sortedRows.length, showOrg, viewMode]);

  const top5Thresholds = useMemo(() => {
    const metricKeys: LeaderboardMetricKey[] = [
      'overall',
      'reasoning',
      'coding',
      'agentic',
      'mathematics',
      'dataAnalysis',
      'language',
      'instructionFollowing',
    ];

    const thresholds: Partial<Record<LeaderboardMetricKey, number>> = {};
    for (const k of metricKeys) {
      const vals = filteredRows
        .map((r) => r.scores[k])
        .filter((v): v is number => v !== null && v !== undefined && v > 0)
        .sort((a, b) => b - a);

      if (vals.length >= 5) {
        thresholds[k] = vals[4];
      } else if (vals.length > 0) {
        thresholds[k] = vals[vals.length - 1];
      }
    }
    return thresholds;
  }, [filteredRows]);

  function handleCategoryClick(cat: (typeof CATEGORIES)[number]) {
    if (activeCategory === cat.id && sortColumn === cat.sortCol) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setActiveCategory(cat.id);
      setSortColumn(cat.sortCol);
      setSortDirection('desc');
    }
  }

  function handleColumnHeaderClick(colKey: LeaderboardColumnKey | 'name') {
    if (sortColumn === colKey) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortColumn(colKey);
      const defaultDir =
        colKey === 'name' || colKey === 'cost' ? 'asc' : 'desc';
      setSortDirection(defaultDir);
      const matchedCat = CATEGORIES.find((c) => c.sortCol === colKey);
      if (matchedCat) {
        setActiveCategory(matchedCat.id);
      } else {
        setActiveCategory('');
      }
    }
  }

  function toggleExpand(slug: string) {
    setExpandedRows((prev) => ({
      ...prev,
      [slug]: !prev[slug],
    }));
  }

  function handleRowClick(slug: string) {
    const selection = window.getSelection()?.toString();
    if (selection && selection.trim().length > 0) return;
    toggleExpand(slug);
  }

  function toggleSelect(slug: string) {
    if (selectedSlugs.includes(slug)) {
      setSelectedSlugs(selectedSlugs.filter((s) => s !== slug));
    } else if (selectedSlugs.length >= 4) {
      alert('You can select up to 4 models to compare.');
    } else {
      setSelectedSlugs([...selectedSlugs, slug]);
    }
  }

  function resetAll() {
    setQuery('');
    setSelectedOrg('');
    setOpenWeightsOnly(false);
    setActiveCategory('all');
    setSortColumn('releaseDate');
    setSortDirection('desc');
  }

  function openMobileModalWithTab(tab: 'categories' | 'columns') {
    setMobileModalTab(tab);
    setTempCategory(activeCategory);
    setTempVisibleColumns({ ...visibleColumns });
    setShowMobileModal(true);
  }

  function applyMobileModal() {
    setActiveCategory(tempCategory);
    const cat = CATEGORIES.find((c) => c.id === tempCategory);
    if (cat) {
      setSortColumn(cat.sortCol);
      setSortDirection('desc');
    }
    setVisibleColumns({ ...tempVisibleColumns });
    setShowMobileModal(false);
  }

  function resetMobileModal() {
    setTempCategory('all');
    const initCols: Record<string, boolean> = {};
    for (const c of ALL_COLUMNS) {
      initCols[c.key] = c.defaultVisible;
    }
    setTempVisibleColumns(initCols as Record<LeaderboardColumnKey, boolean>);
  }

  const visibleColumnsCount = useMemo(() => {
    return ALL_COLUMNS.filter((c) => visibleColumns[c.key]).length;
  }, [visibleColumns]);

  return (
    <div className="leaderboard-container">
      {/* Top Toolbar matching Screenshot 2 */}
      <div className="leaderboard-toolbar">
        <div className="leaderboard-search-wrapper">
          <Search size={16} className="leaderboard-search-icon" />
          <input
            type="search"
            placeholder="Search models..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="leaderboard-search-input"
            aria-label="Search models"
          />
        </div>

        <div className="leaderboard-controls-group">
          <button
            type="button"
            className={`control-btn ${openWeightsOnly ? 'active' : ''}`}
            onClick={() => setOpenWeightsOnly(!openWeightsOnly)}
            aria-pressed={openWeightsOnly}
          >
            Open weights
          </button>

          <button
            type="button"
            className={`control-btn ${includeFinetunes ? 'active' : ''}`}
            onClick={() => setIncludeFinetunes(!includeFinetunes)}
            aria-pressed={includeFinetunes}
          >
            Include finetunes
          </button>

          <button
            type="button"
            className={`control-btn ${showOrg ? 'active' : ''}`}
            onClick={() => setShowOrg(!showOrg)}
            aria-pressed={showOrg}
          >
            Show org
          </button>

          <div className="control-select-wrapper">
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="control-select"
              aria-label="Filter by organization"
            >
              <option value="">All organizations</option>
              {organizations.map((org) => (
                <option key={org} value={org}>
                  {org}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="control-select-arrow" />
          </div>

          <div className="dropdown-container" ref={compareMenuRef}>
            <button
              type="button"
              className={`control-btn ${selectedSlugs.length > 0 ? 'highlight' : ''}`}
              onClick={() => setShowCompareMenu(!showCompareMenu)}
              aria-expanded={showCompareMenu}
            >
              Compare{' '}
              {selectedSlugs.length > 0 ? `(${selectedSlugs.length})` : ''}{' '}
              <ChevronDown size={14} />
            </button>
            {showCompareMenu && (
              <div className="dropdown-menu">
                <span className="dropdown-header">Compare Selection</span>
                {selectedSlugs.length === 0 ? (
                  <p
                    className="micro muted"
                    style={{ margin: 0, padding: '4px 0' }}
                  >
                    Click &apos;+&apos; on any model to add it to comparison.
                  </p>
                ) : (
                  <>
                    <div className="compare-menu-list">
                      {selectedSlugs.map((slug) => {
                        const item = models.find((m) => m.slug === slug);
                        return (
                          <div key={slug} className="compare-menu-item">
                            <span>{item?.name ?? slug}</span>
                            <button
                              onClick={() => toggleSelect(slug)}
                              aria-label={`Remove ${item?.name ?? slug}`}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <a
                      href={`/compare?models=${selectedSlugs.join(',')}`}
                      className="button primary compare-action-btn"
                    >
                      Compare {selectedSlugs.length} models{' '}
                      <ArrowRight size={13} />
                    </a>
                    <button
                      className="text-link-sm"
                      onClick={() => setSelectedSlugs([])}
                    >
                      Clear selection
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="dropdown-container" ref={columnsMenuRef}>
            <button
              type="button"
              className="control-btn"
              onClick={() => setShowColumnsMenu(!showColumnsMenu)}
              aria-expanded={showColumnsMenu}
            >
              Choose columns <ChevronDown size={14} />
            </button>
            {showColumnsMenu && (
              <div className="dropdown-menu">
                <span className="dropdown-header">Visible Columns</span>
                {ALL_COLUMNS.map((col) => (
                  <label key={col.key} className="column-checkbox-label">
                    <input
                      type="checkbox"
                      checked={visibleColumns[col.key]}
                      onChange={(e) =>
                        setVisibleColumns({
                          ...visibleColumns,
                          [col.key]: e.target.checked,
                        })
                      }
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div
            className="view-mode-toggle"
            role="group"
            aria-label="View layout"
          >
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title={isMobileView ? 'List View' : 'Table View'}
              aria-label={isMobileView ? 'List View' : 'Table View'}
              aria-pressed={viewMode === 'table'}
            >
              {isMobileView ? <List size={16} /> : <TableIcon size={16} />}
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Card Grid View"
              aria-label="Card Grid View"
              aria-pressed={viewMode === 'cards'}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Catalog scope indication */}
      <div className="leaderboard-scope-bar">
        <span className="scope-badge">LiveBench-evaluated</span>
        <span className="scope-text">
          Showing models with official LiveBench benchmark evaluations. Scores
          replicate LiveBench arithmetic mean across categories.
        </span>
      </div>

      {/* Category Pills Bar matching Screenshot & Mobile Spec */}
      <div className="leaderboard-categories-container">
        <div
          className="leaderboard-categories"
          role="tablist"
          aria-label="Filter by category"
        >
          <span className="category-label">CATEGORY</span>
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            const isSortedCol = sortColumn === cat.sortCol;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`category-pill ${isActive ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat)}
                title={
                  isActive
                    ? `Currently sorted by ${cat.label} (${sortDirection === 'asc' ? 'ascending' : 'descending'}). Click to toggle.`
                    : `Sort by ${cat.label}`
                }
              >
                <span>{cat.label}</span>
                {isActive && isSortedCol && (
                  <span className="category-pill-sort-icon">
                    {sortDirection === 'asc' ? (
                      <ArrowUp size={11} strokeWidth={2.5} />
                    ) : (
                      <ArrowDown size={11} strokeWidth={2.5} />
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="mobile-filter-sheet-trigger"
          onClick={() => openMobileModalWithTab('categories')}
          aria-label="Open filter and column modal"
        >
          <SlidersHorizontal size={15} />
        </button>
      </div>

      {/* Mobile Sub-toolbar: Columns trigger, Sort dropdown, and View mode */}
      <div className="mobile-subtoolbar">
        <button
          type="button"
          className="mobile-columns-btn"
          onClick={() => openMobileModalWithTab('columns')}
        >
          <TableIcon size={14} />
          <span>Columns</span>
        </button>

        <div className="mobile-sort-select-wrapper">
          <label htmlFor="mobile-sort-select" className="sr-only">
            Sort by
          </label>
          <select
            id="mobile-sort-select"
            className="mobile-sort-select"
            value={sortColumn}
            onChange={(e) => {
              const val = e.target.value as
                LeaderboardColumnKey | 'name' | 'releaseDate';
              setSortColumn(val);
              setSortDirection(
                val === 'name' || val === 'cost' ? 'asc' : 'desc',
              );
              const matchedCat = CATEGORIES.find((c) => c.sortCol === val);
              if (matchedCat) setActiveCategory(matchedCat.id);
            }}
          >
            <option value="overall">Sort: Overall</option>
            <option value="releaseDate">Sort: Release Date</option>
            <option value="reasoning">Sort: Reasoning</option>
            <option value="coding">Sort: Coding</option>
            <option value="agentic">Sort: Agentic Coding</option>
            <option value="mathematics">Sort: Mathematics</option>
            <option value="dataAnalysis">Sort: Data Analysis</option>
            <option value="cost">Sort: Lowest Price</option>
            <option value="speed">Sort: Speed</option>
            <option value="name">Sort: Model Name</option>
          </select>
          <ChevronDown size={13} className="mobile-sort-arrow" />
        </div>

        <div className="mobile-view-toggle">
          <button
            type="button"
            className={`mobile-view-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
            aria-label="Card Grid View"
            aria-pressed={viewMode === 'cards'}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            type="button"
            className={`mobile-view-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            aria-label="List View"
            aria-pressed={viewMode === 'table'}
          >
            <List size={15} />
          </button>
        </div>
      </div>

      <div className="mobile-model-count">
        Showing {sortedRows.length} models
      </div>

      {/* Main Content: Table or Cards */}
      {viewMode === 'table' ? (
        <div className="leaderboard-table-card">
          <div
            ref={tableWrapperRef}
            className={`table-scroll-wrapper ${sortedRows.length > 25 ? 'is-scrollable' : ''}`}
            style={
              tableMaxHeight ? { maxHeight: `${tableMaxHeight}px` } : undefined
            }
          >
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th
                    className="th-expand"
                    aria-label="Expand details column"
                  ></th>
                  <th
                    className={`th-model th-sortable th-align-left ${sortColumn === 'name' ? 'col-sorted' : ''}`}
                    scope="col"
                    aria-sort={
                      sortColumn === 'name'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      className={`th-sort-button ${sortColumn === 'name' ? 'is-sorted' : ''}`}
                      onClick={() => handleColumnHeaderClick('name')}
                      title={`Sort by Model name (${sortColumn === 'name' && sortDirection === 'asc' ? 'currently A to Z; click for Z to A' : 'click for A to Z'})`}
                      aria-label={`Sort by Model name${sortColumn === 'name' ? `, currently sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}` : ''}`}
                    >
                      <span className="th-label">MODEL</span>
                      <span
                        className={`sort-icon-wrap ${sortColumn === 'name' ? 'active' : 'idle'}`}
                      >
                        {sortColumn === 'name' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp
                              size={13}
                              className="sort-icon active"
                              aria-hidden="true"
                            />
                          ) : (
                            <ArrowDown
                              size={13}
                              className="sort-icon active"
                              aria-hidden="true"
                            />
                          )
                        ) : (
                          <ArrowUpDown
                            size={13}
                            className="sort-icon idle"
                            aria-hidden="true"
                          />
                        )}
                      </span>
                    </button>
                  </th>
                  {ALL_COLUMNS.filter((col) => visibleColumns[col.key]).map(
                    (col) => {
                      const isSorted = sortColumn === col.key;
                      const nextDir = isSorted
                        ? sortDirection === 'asc'
                          ? 'desc'
                          : 'asc'
                        : col.key === 'cost'
                          ? 'asc'
                          : 'desc';
                      const directionHint =
                        nextDir === 'asc'
                          ? col.key === 'cost'
                            ? 'lowest cost first'
                            : 'lowest score first'
                          : col.key === 'cost'
                            ? 'highest cost first'
                            : 'highest score first';

                      return (
                        <th
                          key={col.key}
                          className={`th-metric th-${col.key} th-sortable th-align-${col.align} ${isSorted ? 'col-sorted' : ''}`}
                          scope="col"
                          aria-sort={
                            isSorted
                              ? sortDirection === 'asc'
                                ? 'ascending'
                                : 'descending'
                              : 'none'
                          }
                        >
                          <button
                            type="button"
                            className={`th-sort-button ${isSorted ? 'is-sorted' : ''}`}
                            onClick={() => handleColumnHeaderClick(col.key)}
                            title={`Sort by ${col.label} (click for ${directionHint})`}
                            aria-label={`Sort by ${col.label}${isSorted ? `, currently sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}` : ''}`}
                          >
                            <span className="th-label">{col.label}</span>
                            <span
                              className={`sort-icon-wrap ${isSorted ? 'active' : 'idle'}`}
                            >
                              {isSorted ? (
                                sortDirection === 'asc' ? (
                                  <ArrowUp
                                    size={13}
                                    className="sort-icon active"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <ArrowDown
                                    size={13}
                                    className="sort-icon active"
                                    aria-hidden="true"
                                  />
                                )
                              ) : (
                                <ArrowUpDown
                                  size={13}
                                  className="sort-icon idle"
                                  aria-hidden="true"
                                />
                              )}
                            </span>
                          </button>
                        </th>
                      );
                    },
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnsCount + 2}
                      style={{ textAlign: 'center', padding: '40px 16px' }}
                    >
                      <p style={{ margin: '0 0 12px', color: 'var(--muted)' }}>
                        No models match your search criteria.
                      </p>
                      <button
                        className="button primary"
                        type="button"
                        onClick={resetAll}
                      >
                        Reset filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((row) => {
                    const isExpanded = Boolean(expandedRows[row.model.slug]);
                    const isSelected = selectedSlugs.includes(row.model.slug);

                    return (
                      <React.Fragment key={row.model.slug}>
                        <tr
                          className={`leaderboard-row ${isSelected ? 'row-selected' : ''}`}
                          onClick={() => handleRowClick(row.model.slug)}
                        >
                          <td className="td-expand">
                            <button
                              type="button"
                              className={`expand-caret-btn ${isExpanded ? 'rotated' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(row.model.slug);
                              }}
                              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${row.model.name}`}
                            >
                              <ChevronRight size={14} />
                            </button>
                          </td>

                          <td
                            className={`td-model ${sortColumn === 'name' ? 'col-sorted' : ''}`}
                          >
                            <div className="model-cell-content">
                              <a
                                href={`/models/${row.model.slug}`}
                                className="model-link-title"
                                onClick={(e) => {
                                  if (
                                    !e.metaKey &&
                                    !e.ctrlKey &&
                                    !e.shiftKey &&
                                    !e.altKey &&
                                    e.button === 0
                                  ) {
                                    e.preventDefault();
                                  }
                                }}
                              >
                                {row.model.name}
                              </a>
                              {row.effortLabel && (
                                <span className="model-effort-badge">
                                  {row.effortLabel}
                                </span>
                              )}
                            </div>
                            {showOrg && (
                              <div className="model-org-sub">
                                <ProviderLogo
                                  provider={row.model.provider}
                                  size={13}
                                />
                                <span>{row.model.provider}</span>
                              </div>
                            )}
                          </td>

                          {visibleColumns.overall && (
                            <td
                              className={`td-metric td-bold td-align-center ${sortColumn === 'overall' ? 'col-sorted' : ''}`}
                            >
                              {row.scores.overall !== null
                                ? row.scores.overall.toFixed(1)
                                : '—'}
                            </td>
                          )}

                          {visibleColumns.reasoning && (
                            <td
                              className={`td-metric td-align-center ${sortColumn === 'reasoning' ? 'col-sorted' : ''} ${
                                top5Thresholds.reasoning !== undefined &&
                                row.scores.reasoning !== null &&
                                row.scores.reasoning >=
                                  top5Thresholds.reasoning &&
                                sortColumn !== 'reasoning'
                                  ? 'cell-top5'
                                  : ''
                              }`}
                            >
                              {row.scores.reasoning !== null
                                ? row.scores.reasoning.toFixed(1)
                                : '—'}
                            </td>
                          )}

                          {visibleColumns.coding && (
                            <td
                              className={`td-metric td-align-center ${sortColumn === 'coding' ? 'col-sorted' : ''} ${
                                top5Thresholds.coding !== undefined &&
                                row.scores.coding !== null &&
                                row.scores.coding >= top5Thresholds.coding &&
                                sortColumn !== 'coding'
                                  ? 'cell-top5'
                                  : ''
                              }`}
                            >
                              {row.scores.coding !== null
                                ? row.scores.coding.toFixed(1)
                                : '—'}
                            </td>
                          )}

                          {visibleColumns.agentic && (
                            <td
                              className={`td-metric td-align-center ${sortColumn === 'agentic' ? 'col-sorted' : ''} ${
                                top5Thresholds.agentic !== undefined &&
                                row.scores.agentic !== null &&
                                row.scores.agentic >= top5Thresholds.agentic &&
                                sortColumn !== 'agentic'
                                  ? 'cell-top5'
                                  : ''
                              }`}
                            >
                              {row.scores.agentic !== null
                                ? row.scores.agentic.toFixed(1)
                                : '—'}
                            </td>
                          )}

                          {visibleColumns.mathematics && (
                            <td
                              className={`td-metric td-align-center ${sortColumn === 'mathematics' ? 'col-sorted' : ''} ${
                                top5Thresholds.mathematics !== undefined &&
                                row.scores.mathematics !== null &&
                                row.scores.mathematics >=
                                  top5Thresholds.mathematics &&
                                sortColumn !== 'mathematics'
                                  ? 'cell-top5'
                                  : ''
                              }`}
                            >
                              {row.scores.mathematics !== null
                                ? row.scores.mathematics.toFixed(1)
                                : '—'}
                            </td>
                          )}

                          {visibleColumns.dataAnalysis && (
                            <td
                              className={`td-metric td-align-center ${sortColumn === 'dataAnalysis' ? 'col-sorted' : ''} ${
                                top5Thresholds.dataAnalysis !== undefined &&
                                row.scores.dataAnalysis !== null &&
                                row.scores.dataAnalysis >=
                                  top5Thresholds.dataAnalysis &&
                                sortColumn !== 'dataAnalysis'
                                  ? 'cell-top5'
                                  : ''
                              }`}
                            >
                              {row.scores.dataAnalysis !== null
                                ? row.scores.dataAnalysis.toFixed(1)
                                : '—'}
                            </td>
                          )}

                          {visibleColumns.language && (
                            <td
                              className={`td-metric td-align-center ${sortColumn === 'language' ? 'col-sorted' : ''} ${
                                top5Thresholds.language !== undefined &&
                                row.scores.language !== null &&
                                row.scores.language >=
                                  top5Thresholds.language &&
                                sortColumn !== 'language'
                                  ? 'cell-top5'
                                  : ''
                              }`}
                            >
                              {row.scores.language !== null
                                ? row.scores.language.toFixed(1)
                                : '—'}
                            </td>
                          )}

                          {visibleColumns.instructionFollowing && (
                            <td
                              className={`td-metric td-align-center ${sortColumn === 'instructionFollowing' ? 'col-sorted' : ''} ${
                                top5Thresholds.instructionFollowing !==
                                  undefined &&
                                row.scores.instructionFollowing !== null &&
                                row.scores.instructionFollowing >=
                                  top5Thresholds.instructionFollowing &&
                                sortColumn !== 'instructionFollowing'
                                  ? 'cell-top5'
                                  : ''
                              }`}
                            >
                              {row.scores.instructionFollowing !== null
                                ? row.scores.instructionFollowing.toFixed(1)
                                : '—'}
                            </td>
                          )}

                          {visibleColumns.cost && (
                            <td
                              className={`td-metric td-cost td-align-right ${sortColumn === 'cost' ? 'col-sorted' : ''}`}
                            >
                              {formatPrice(row.inputPrice)}
                            </td>
                          )}

                          {visibleColumns.speed && (
                            <td
                              className={`td-metric td-speed td-align-center ${sortColumn === 'speed' ? 'col-sorted' : ''}`}
                            >
                              {row.speedLabel ?? '—'}
                            </td>
                          )}
                        </tr>

                        {isExpanded && (
                          <tr className="subtask-expanded-row">
                            <td colSpan={visibleColumnsCount + 2}>
                              <div className="subtask-expanded-panel">
                                <div className="subtask-top-row">
                                  <div className="subtask-title-group">
                                    <h4>{row.model.name}</h4>
                                    <span className="micro muted provider-badge">
                                      <ProviderLogo
                                        provider={row.model.provider}
                                        size={14}
                                      />
                                      {row.model.provider}
                                    </span>
                                    {row.model.facts.releaseDate && (
                                      <span className="release-date">
                                        {row.model.facts.releaseDate}
                                      </span>
                                    )}
                                    {row.maxEffort !== 'none' && (
                                      <span className="effort-badge">
                                        {row.maxEffort === 'fixed'
                                          ? 'Fixed CoT'
                                          : `Default Effort: ${row.maxEffort}`}
                                      </span>
                                    )}
                                    {row.isOpenWeights && (
                                      <span className="badge-open">open</span>
                                    )}
                                  </div>
                                  <div className="subtask-buttons">
                                    <button
                                      type="button"
                                      className={`button ${isSelected ? 'primary' : ''}`}
                                      onClick={() =>
                                        toggleSelect(row.model.slug)
                                      }
                                    >
                                      {isSelected ? (
                                        <Check size={14} />
                                      ) : (
                                        <Plus size={14} />
                                      )}{' '}
                                      {isSelected
                                        ? 'Added to Compare'
                                        : 'Add to Compare'}
                                    </button>
                                    <a
                                      className="button"
                                      href={`/models/${row.model.slug}`}
                                    >
                                      View Full Model Guide{' '}
                                      <ExternalLink size={13} />
                                    </a>
                                  </div>
                                </div>
                                <p className="subtask-desc">
                                  {row.model.description}
                                </p>
                                <div className="subtask-spec-grid">
                                  <div>
                                    <span className="spec-label">Speed</span>
                                    <strong>{row.speedLabel ?? '—'}</strong>
                                  </div>
                                  <div>
                                    <span className="spec-label">
                                      Context Window
                                    </span>
                                    <strong>
                                      {contextSize(row.model.facts.context)}
                                    </strong>
                                  </div>
                                  <div>
                                    <span className="spec-label">
                                      Input Price
                                    </span>
                                    <strong>
                                      {getDisplayPriceLabel(row.model, 'input')}{' '}
                                      / 1M
                                    </strong>
                                  </div>
                                  <div>
                                    <span className="spec-label">
                                      Output Price
                                    </span>
                                    <strong>
                                      {getDisplayPriceLabel(
                                        row.model,
                                        'output',
                                      )}{' '}
                                      / 1M
                                    </strong>
                                  </div>
                                  <div>
                                    <span className="spec-label">
                                      Modalities
                                    </span>
                                    <strong>
                                      {getModalitiesLabel({
                                        vision: row.model.facts.vision,
                                        audio: row.model.facts.audio,
                                      })}
                                    </strong>
                                  </div>
                                  <div>
                                    <span className="spec-label">
                                      Reasoning Tiers
                                    </span>
                                    <strong>
                                      {row.model.facts.reasoningEffort?.join(
                                        ', ',
                                      ) || 'None'}
                                    </strong>
                                  </div>
                                </div>
                                <ModelDataSources sources={row.detailSources} />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer note matching Screenshot 2 */}
          <div className="leaderboard-footer-note">
            <code>
              // select 1 category for its subtasks, or several to compare
              category averages · shading = top 5 per column · click a row for
              subtasks · Price = standard input API rate per million tokens.
              Tiered, stale and unavailable rates are not ranked.
            </code>
          </div>
        </div>
      ) : (
        /* Card Grid View (Alternative toggle) */
        <div className="model-grid explorer-grid">
          {sortedRows.map((row) => (
            <ModelCard
              key={row.model.slug}
              model={row.model}
              selected={selectedSlugs.includes(row.model.slug)}
              onSelect={() => toggleSelect(row.model.slug)}
            />
          ))}
        </div>
      )}

      {/* Mobile-only List View (Rendered directly on mobile when viewMode === 'table') */}
      {viewMode === 'table' && (
        <div className="mobile-model-list">
          {sortedRows.length === 0 ? (
            <div className="mobile-empty-state">
              <p>No models match your criteria.</p>
              <button className="button primary" onClick={resetAll}>
                Reset filters
              </button>
            </div>
          ) : (
            sortedRows.map((row, index) => {
              const isExpanded = Boolean(expandedRows[row.model.slug]);
              const isSelected = selectedSlugs.includes(row.model.slug);

              // Extract top 3 metrics to display
              const metricCandidates: Array<{
                label: string;
                val: number | null;
              }> = [
                { label: 'Reasoning', val: row.scores.reasoning },
                { label: 'Coding', val: row.scores.coding },
                { label: 'Agentic', val: row.scores.agentic },
                { label: 'Mathematics', val: row.scores.mathematics },
                { label: 'Data Analysis', val: row.scores.dataAnalysis },
              ];
              const topMetrics = metricCandidates
                .filter(
                  (m) => m.val !== null && m.val !== undefined && m.val > 0,
                )
                .slice(0, 3);

              return (
                <div
                  key={row.model.slug}
                  className={`mobile-model-row-card ${isExpanded ? 'is-expanded' : ''} ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => handleRowClick(row.model.slug)}
                >
                  <div className="mobile-card-header">
                    <button
                      type="button"
                      className={`mobile-expand-btn ${isExpanded ? 'rotated' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(row.model.slug);
                      }}
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${row.displayName}`}
                    >
                      <ChevronRight size={16} />
                    </button>

                    <div className="mobile-title-block">
                      <div className="mobile-title-line">
                        <a
                          href={`/models/${row.model.slug}`}
                          className="mobile-model-name"
                          onClick={(e) => {
                            if (
                              !e.metaKey &&
                              !e.ctrlKey &&
                              !e.shiftKey &&
                              !e.altKey &&
                              e.button === 0
                            ) {
                              e.preventDefault();
                            }
                          }}
                        >
                          {row.model.name}
                        </a>
                        {row.effortLabel && (
                          <span className="model-effort-badge">
                            {row.effortLabel}
                          </span>
                        )}
                        {row.isOpenWeights && (
                          <span className="badge-open">open</span>
                        )}
                      </div>
                      <div className="mobile-model-score-line">
                        <span className="mobile-score-val">
                          {row.scores.overall !== null
                            ? row.scores.overall.toFixed(1)
                            : '—'}
                        </span>
                        <span className="mobile-score-lbl">Overall</span>
                      </div>
                    </div>

                    <div className="mobile-card-actions">
                      <span className="mobile-rank-badge">#{index + 1}</span>
                      <a
                        href={`/models/${row.model.slug}`}
                        className="mobile-detail-chevron"
                        aria-label={`View details for ${row.displayName}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ChevronRight size={18} />
                      </a>
                    </div>
                  </div>

                  {/* Top 3 metrics row */}
                  {topMetrics.length > 0 && (
                    <div className="mobile-metrics-strip">
                      {topMetrics.map((m) => (
                        <div key={m.label} className="mobile-metric-item">
                          <span className="mobile-metric-val">
                            {m.val !== null ? m.val.toFixed(1) : '—'}
                          </span>
                          <span className="mobile-metric-lbl">{m.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Model tag pills */}
                  <div className="mobile-tags-row">
                    <span className="mobile-tag-pill provider-pill">
                      <ProviderLogo provider={row.model.provider} size={13} />
                      {row.model.provider}
                    </span>
                    {row.model.tags.slice(0, 2).map((t) => (
                      <span key={t} className="mobile-tag-pill">
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Expandable full details row */}
                  {isExpanded && (
                    <div
                      className="mobile-expanded-details"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="mobile-expanded-desc">
                        {row.model.description}
                      </p>

                      <div className="mobile-expanded-specs">
                        <div>
                          <span className="spec-label">Speed</span>
                          <strong>{row.speedLabel ?? '—'}</strong>
                        </div>
                        <div>
                          <span className="spec-label">Context</span>
                          <strong>
                            {contextSize(row.model.facts.context)}
                          </strong>
                        </div>
                        <div>
                          <span className="spec-label">Input Price</span>
                          <strong>
                            {getDisplayPriceLabel(row.model, 'input')} / 1M
                          </strong>
                        </div>
                        <div>
                          <span className="spec-label">Modalities</span>
                          <strong>
                            {getModalitiesLabel({
                              vision: row.model.facts.vision,
                              audio: row.model.facts.audio,
                            })}
                          </strong>
                        </div>
                        <div>
                          <span className="spec-label">Output Price</span>
                          <strong>
                            {getDisplayPriceLabel(row.model, 'output')} / 1M
                          </strong>
                        </div>
                        {row.model.facts.releaseDate && (
                          <div>
                            <span className="spec-label">Released</span>
                            <strong>{row.model.facts.releaseDate}</strong>
                          </div>
                        )}
                        {row.maxEffort !== 'none' && (
                          <div>
                            <span className="spec-label">Reasoning Effort</span>
                            <strong>
                              {row.maxEffort === 'fixed'
                                ? 'Fixed CoT'
                                : row.maxEffort}
                            </strong>
                          </div>
                        )}
                      </div>

                      {/* All visible column scores */}
                      <div className="mobile-expanded-all-scores">
                        <span
                          className="spec-label"
                          style={{ marginBottom: '6px' }}
                        >
                          All Scores
                        </span>
                        <div className="mobile-scores-grid">
                          {ALL_COLUMNS.filter(
                            (c) => c.key !== 'cost' && c.key !== 'speed',
                          ).map((col) => {
                            const val = row.scores[col.key];
                            return (
                              <div key={col.key} className="mobile-score-cell">
                                <span className="cell-lbl">{col.label}</span>
                                <span className="cell-val">
                                  {val !== null && val !== undefined
                                    ? Number(val).toFixed(1)
                                    : '—'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <ModelDataSources sources={row.detailSources} />

                      <div className="mobile-expanded-btns">
                        <button
                          type="button"
                          className={`button ${isSelected ? 'primary' : ''}`}
                          onClick={() => toggleSelect(row.model.slug)}
                        >
                          {isSelected ? (
                            <Check size={14} />
                          ) : (
                            <Plus size={14} />
                          )}
                          {isSelected ? 'In Compare' : 'Add to Compare'}
                        </button>
                        <a
                          className="button"
                          href={`/models/${row.model.slug}`}
                        >
                          Model Guide <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Mobile Filter & Columns Bottom Sheet Modal */}
      {showMobileModal && (
        <div
          className="mobile-modal-overlay"
          onClick={() => setShowMobileModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-modal-title"
        >
          <div
            className="mobile-modal-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-modal-header">
              <h3 id="mobile-modal-title">Filters &amp; Columns</h3>
              <button
                type="button"
                className="mobile-modal-close"
                onClick={() => setShowMobileModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-modal-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mobileModalTab === 'categories'}
                className={`mobile-tab-btn ${mobileModalTab === 'categories' ? 'active' : ''}`}
                onClick={() => setMobileModalTab('categories')}
              >
                Categories
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mobileModalTab === 'columns'}
                className={`mobile-tab-btn ${mobileModalTab === 'columns' ? 'active' : ''}`}
                onClick={() => setMobileModalTab('columns')}
              >
                Columns
              </button>
            </div>

            <div className="mobile-modal-content">
              {mobileModalTab === 'categories' ? (
                <div className="mobile-checkbox-list">
                  {CATEGORIES.map((cat) => {
                    const isChecked = tempCategory === cat.id;
                    return (
                      <label key={cat.id} className="mobile-checkbox-row">
                        <input
                          type="radio"
                          name="mobile-cat-group"
                          checked={isChecked}
                          onChange={() => setTempCategory(cat.id)}
                        />
                        <span className="checkbox-custom">
                          {isChecked && <Check size={12} strokeWidth={3} />}
                        </span>
                        <span className="checkbox-text">{cat.label}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="mobile-checkbox-list">
                  {ALL_COLUMNS.map((col) => {
                    const isChecked = tempVisibleColumns[col.key];
                    return (
                      <label key={col.key} className="mobile-checkbox-row">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setTempVisibleColumns({
                              ...tempVisibleColumns,
                              [col.key]: e.target.checked,
                            })
                          }
                        />
                        <span className="checkbox-custom">
                          {isChecked && <Check size={12} strokeWidth={3} />}
                        </span>
                        <span className="checkbox-text">{col.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mobile-modal-footer">
              <button
                type="button"
                className="mobile-modal-reset"
                onClick={resetMobileModal}
              >
                Reset
              </button>
              <button
                type="button"
                className="button primary mobile-modal-apply"
                onClick={applyMobileModal}
              >
                Apply (
                {mobileModalTab === 'categories'
                  ? 1
                  : Object.values(tempVisibleColumns).filter(Boolean).length}
                )
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Compare Tray when models are selected */}
      {selectedSlugs.length > 0 && (
        <div className="compare-tray">
          <strong>{selectedSlugs.length} / 4 selected</strong>
          {selectedSlugs.map((slug) => {
            const m = models.find((item) => item.slug === slug);
            return (
              <span className="selection-chip" key={slug}>
                {m && <ProviderLogo provider={m.provider} size={15} />}
                {m?.name}
                <button
                  aria-label={`Remove ${m?.name}`}
                  onClick={() => toggleSelect(slug)}
                >
                  <X size={13} />
                </button>
              </span>
            );
          })}
          {selectedSlugs.length >= 2 ? (
            <a
              className="button primary"
              href={`/compare?models=${selectedSlugs.join(',')}`}
            >
              Compare models <ArrowRight size={15} />
            </a>
          ) : (
            <span className="micro">Add one more to compare</span>
          )}
        </div>
      )}
    </div>
  );
}
