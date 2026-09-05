import { useEffect, useState } from 'react';
import type { CatalogModel } from '../lib/catalogSchema';
import { workloads } from '../data/config';
import { money, selectionFromSearch, taskCost } from '../lib/decision';
export default function CostCalculator({ models }: { models: CatalogModel[] }) {
  const [advanced, setAdvanced] = useState(false);
  const [work, setWork] = useState<keyof typeof workloads>('chat');
  const [requests, setRequests] = useState('20');
  const [days, setDays] = useState('30');
  const [input, setInput] = useState('500');
  const [output, setOutput] = useState('500');
  const [success, setSuccess] = useState('100');
  const [tools, setTools] = useState('0');
  const [toolPrice, setToolPrice] = useState('0');
  const [selected, setSelected] = useState(
    models.slice(0, 5).map((m) => m.slug),
  );
  useEffect(() => {
    const values = selectionFromSearch(location.search, models);
    if (values.length) setSelected(values);
  }, [models]);
  const inputTokens = advanced ? Number(input) : workloads[work].input;
  const outputTokens = advanced ? Number(output) : workloads[work].output;
  const countsValid = [
    requests,
    days,
    success,
    tools,
    toolPrice,
    ...(advanced ? [input, output] : []),
  ].every(
    (n) => n.trim() !== '' && Number.isFinite(Number(n)) && Number(n) >= 0,
  );
  const valid =
    countsValid &&
    Number(success) > 0 &&
    Number(success) <= 100 &&
    Number(days) <= 31 &&
    Number(days) >= 1 &&
    Number.isInteger(Number(days)) &&
    Number.isInteger(Number(requests)) &&
    Number.isInteger(Number(tools)) &&
    Number.isInteger(inputTokens) &&
    Number.isInteger(outputTokens);
  const rows = valid
    ? models
        .filter((m) => selected.includes(m.slug))
        .map((model) => ({
          model,
          cost: taskCost(
            model,
            inputTokens,
            outputTokens,
            Number(success) / 100,
            Number(tools),
            Number(toolPrice),
          ),
        }))
        .sort((a, b) => a.cost - b.cost)
    : [];
  return (
    <div className="calculator-layout">
      <section className="panel calculator-inputs">
        <div className="segmented" aria-label="Calculator mode">
          <button aria-pressed={!advanced} onClick={() => setAdvanced(false)}>
            Simple
          </button>
          <button aria-pressed={advanced} onClick={() => setAdvanced(true)}>
            Advanced
          </button>
        </div>
        {!advanced ? (
          <label className="field">
            What type of work?
            <select
              value={work}
              onChange={(e) =>
                setWork(e.target.value as keyof typeof workloads)
              }
            >
              {Object.entries(workloads).map(([key, profile]) => (
                <option key={key} value={key}>
                  {profile.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <>
            <label className="field">
              Input tokens per attempt
              <input
                type="number"
                min="0"
                step="1"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </label>
            <label className="field">
              Output tokens per attempt
              <input
                type="number"
                min="0"
                step="1"
                value={output}
                onChange={(e) => setOutput(e.target.value)}
              />
            </label>
          </>
        )}
        <label className="field">
          {advanced ? 'Requests' : 'Messages or tasks'} per day
          {advanced ? (
            <input
              type="number"
              min="0"
              step="1"
              value={requests}
              onChange={(e) => setRequests(e.target.value)}
            />
          ) : (
            <select
              value={requests}
              onChange={(e) => setRequests(e.target.value)}
            >
              <option value="5">5 per day · occasional</option>
              <option value="20">20 per day · regular</option>
              <option value="50">50 per day · frequent</option>
              <option value="100">100 per day · heavy use</option>
              {!['5', '20', '50', '100'].includes(requests) && (
                <option value={requests}>{requests} per day · custom</option>
              )}
            </select>
          )}
        </label>
        <label className="field">
          Days per month
          <input
            type="number"
            min="1"
            max="31"
            step="1"
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
        </label>
        <details>
          <summary>Retries & tool costs</summary>
          <label className="field">
            Assumed success rate (%)
            <input
              type="number"
              min="1"
              max="100"
              value={success}
              onChange={(e) => setSuccess(e.target.value)}
            />
          </label>
          <label className="field">
            Tool calls per attempt
            <input
              type="number"
              min="0"
              step="1"
              value={tools}
              onChange={(e) => setTools(e.target.value)}
            />
          </label>
          <label className="field">
            Cost per tool call (USD)
            <input
              type="number"
              min="0"
              step="0.001"
              value={toolPrice}
              onChange={(e) => setToolPrice(e.target.value)}
            />
          </label>
        </details>
        <p className="micro">
          API usage only. Chat subscriptions, hosting, taxes, caching discounts,
          and provider-specific image or reasoning billing are not included.
        </p>
      </section>
      <section>
        <div className="estimate-heading">
          <div>
            <h2>Your estimated monthly cost</h2>
            <p>A common workload. A fairer price comparison.</p>
          </div>
        </div>
        <fieldset className="panel">
          <legend>Models to include</legend>
          <div className="cost-model-choice">
            {models.map((m) => (
              <label className="checkbox-label" key={m.slug}>
                <input
                  type="checkbox"
                  checked={selected.includes(m.slug)}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked
                        ? [...selected, m.slug]
                        : selected.filter((x) => x !== m.slug),
                    )
                  }
                />
                {m.name}
              </label>
            ))}
          </div>
        </fieldset>
        {!valid ? (
          <div className="notice" role="alert">
            Enter whole, non-negative token and request counts, 1-31 whole days,
            and a success rate above 0 and at most 100%. Tool prices may be
            decimal amounts.
          </div>
        ) : !rows.length ? (
          <div className="empty-state">
            <h3>Choose a model to estimate.</h3>
            <p>Select one or more models above to compare costs.</p>
          </div>
        ) : (
          <>
            <div className="notice">
              Illustrative estimate: {inputTokens.toLocaleString()} input and{' '}
              {outputTokens.toLocaleString()} output tokens per attempt;{' '}
              {requests} tasks per day for {days} days. Success rate: {success}
              %.
            </div>
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Cost estimates"
            >
              <table className="cost-table">
                <caption className="sr-only">
                  Estimated sample API costs in US dollars
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Model</th>
                    <th scope="col">Per task</th>
                    <th scope="col">Per day</th>
                    <th scope="col">Per month</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ model, cost }, i) => (
                    <tr key={model.slug}>
                      <th scope="row">
                        <a href={`/models/${model.slug}`}>{model.name}</a>
                        {i === 0 && (
                          <span className="winner-label accent">
                            Lowest estimated cost
                          </span>
                        )}
                      </th>
                      <td>{money(cost, 4)}</td>
                      <td>{money(cost * Number(requests), 3)}</td>
                      <td className={i === 0 ? 'winner' : ''}>
                        {money(cost * Number(requests) * Number(days))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <details className="score-details">
          <summary>What goes into this estimate?</summary>
          <p>
            Cost per attempt = (input tokens × input price + output tokens ×
            output price) / 1,000,000 + tool calls × tool price. Expected cost
            per completed task = cost per attempt / success probability. Monthly
            cost = expected task cost × tasks per day × days.
          </p>
          <p>
            The success rate is your assumption, not an observed model
            completion rate. The formula assumes independent retries with
            constant cost and success probability. All model prices are sample
            fixtures.
          </p>
        </details>
      </section>
    </div>
  );
}
