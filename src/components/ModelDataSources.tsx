import { ExternalLink } from 'lucide-react';
import type { ModelDetailSource } from '../lib/modelDetailSources';

export function ModelDataSources({
  sources,
}: {
  sources: ModelDetailSource[];
}) {
  return (
    <section className="model-data-sources" aria-label="Data sources">
      <h5>Data sources</h5>
      {sources.length === 0 ? (
        <p>Source details are unavailable.</p>
      ) : (
        <ul>
          {sources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${source.name} source`}
              >
                <span>{source.name}</span>
                <ExternalLink size={12} aria-hidden="true" />
              </a>
              <small>
                {source.coverage.join(' · ')} · Retrieved{' '}
                <time dateTime={source.retrievedAt}>{source.retrievedAt}</time>
              </small>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
