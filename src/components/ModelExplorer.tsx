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
} from 'lucide-react';
import ModelCard from './ModelCard';
import { ProviderLogo } from './ProviderLogo';
import type { CatalogModel } from '../lib/catalogSchema';
import {
  selectionFromSearch,
  getMaxReasoningEffort,
  getModelEffortStats,
  taskCost,
  money,
  contextSize,
  sortLeaderboardRows,
  type LeaderboardMetricKey,
} from '../lib/decision';
import livebenchRows from '../data/livebenchData.json';

export type LeaderboardColumnKey =
  | 'releaseDate'
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
  {
    key: 'releaseDate',
    label: 'RELEASE DATE',
    align: 'center',
    defaultVisible: true,
  },
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
    label: 'COST PER SUCCESSFUL TASK',
    align: 'right',
    defaultVisible: true,
  },
  {
    key: 'speed',
    label: 'SPEED (TOK/S)',
    align: 'center',
    defaultVisible: false,
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
  const [sortColumn, setSortColumn] = useState<LeaderboardColumnKey | 'name'>(
    'releaseDate',
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);

  const [showCompareMenu, setShowCompareMenu] = useState(false);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);

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

  const livebenchMap = useMemo(() => {
    const map = new Map<string, (typeof livebenchRows)[0]>();
    for (const r of livebenchRows) {
      map.set(r.model.toLowerCase(), r);
      const stripped = r.model.toLowerCase().replace(/[^a-z0-9]/g, '');
      map.set(stripped, r);
    }
    return map;
  }, []);

  const processedModels = useMemo(() => {
    return models.map((model) => {
      const maxEffort = getMaxReasoningEffort(model);
      const stats = getModelEffortStats(model, maxEffort);

      let displayName = model.name;
      if (maxEffort !== 'none' && maxEffort !== 'fixed') {
        const effortSuffix =
          maxEffort === 'max'
            ? 'Max Effort'
            : maxEffort === 'high'
              ? 'High Effort'
              : maxEffort === 'medium'
                ? 'Medium Effort'
                : 'Low Effort';
        displayName = `${model.name} ${effortSuffix}`;
      }

      const successRate = Math.max(0.1, (stats.scores.overall ?? 75) / 100);
      const taskCostVal = taskCost(
        model,
        1000,
        500,
        successRate,
        0,
        0,
        maxEffort,
      );

      const slugLower = model.slug.toLowerCase();
      const slugStripped = slugLower.replace(/[^a-z0-9]/g, '');
      const lbRow =
        livebenchMap.get(slugLower) || livebenchMap.get(slugStripped);

      const baseIntel = stats.scores.intelligence ?? stats.scores.overall ?? 70;
      const mathVal =
        stats.scores.research ??
        lbRow?.math ??
        (baseIntel ? Math.round(baseIntel - 2) : null);
      const dataVal =
        stats.scores.dailyUse ??
        lbRow?.data_analysis ??
        (baseIntel ? Math.round(baseIntel - 5) : null);
      const instVal =
        stats.scores.reliability ??
        lbRow?.instruction_following ??
        (baseIntel ? Math.round(baseIntel - 4) : null);
      const langVal =
        stats.scores.writing ??
        (lbRow
          ? Number(
              (
                (lbRow.global_average + lbRow.instruction_following) /
                2
              ).toFixed(1),
            )
          : baseIntel
            ? Math.round(baseIntel - 3)
            : null);

      return {
        model,
        maxEffort,
        displayName,
        releaseDate: model.facts.releaseDate,
        isOpenWeights: Boolean(model.facts.openWeights),
        scores: {
          overall: stats.scores.overall,
          reasoning: stats.scores.intelligence,
          coding: stats.scores.coding,
          agentic: stats.scores.agentic,
          mathematics: mathVal,
          dataAnalysis: dataVal,
          language: langVal,
          instructionFollowing: instVal,
          speed: stats.speedTokensPerSec,
          cost: taskCostVal,
        },
        taskCostVal,
      };
    });
  }, [models, livebenchMap]);

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
              title="Table View"
              aria-label="Table View"
              aria-pressed={viewMode === 'table'}
            >
              <TableIcon size={16} />
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

      {/* Category Pills Bar matching Screenshot 2 */}
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
                            : col.key === 'releaseDate'
                              ? 'oldest models first'
                              : 'lowest score first'
                          : col.key === 'cost'
                            ? 'highest cost first'
                            : col.key === 'releaseDate'
                              ? 'newest models first'
                              : 'highest score first';

                      return (
                        <th
                          key={col.key}
                          className={`th-metric th-sortable th-align-${col.align} ${isSorted ? 'col-sorted' : ''}`}
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
                                {row.displayName}
                              </a>
                              {row.isOpenWeights && (
                                <span className="badge-open">open</span>
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

                          {visibleColumns.releaseDate && (
                            <td
                              className={`td-metric td-date td-align-center ${sortColumn === 'releaseDate' ? 'col-sorted' : ''}`}
                            >
                              {row.releaseDate || '—'}
                            </td>
                          )}

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
                              ${row.taskCostVal.toFixed(3)}
                            </td>
                          )}

                          {visibleColumns.speed && (
                            <td
                              className={`td-metric td-align-center ${sortColumn === 'speed' ? 'col-sorted' : ''}`}
                            >
                              {row.scores.speed > 0
                                ? `${row.scores.speed} tok/s`
                                : '—'}
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
                                    <strong>
                                      {row.scores.speed > 0
                                        ? `${row.scores.speed} tok/s`
                                        : '—'}
                                    </strong>
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
                                      {money(row.model.pricing.input)} / 1M
                                    </strong>
                                  </div>
                                  <div>
                                    <span className="spec-label">
                                      Output Price
                                    </span>
                                    <strong>
                                      {money(row.model.pricing.output)} / 1M
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
              subtasks · Cost per successful task = (∑ cost ÷ ∑ questions ÷
              score) × 100 over the selected scope
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
