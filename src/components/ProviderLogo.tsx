import React from 'react';

export interface ProviderLogoProps {
  provider: string;
  size?: number;
  className?: string;
}

export const ProviderLogo: React.FC<ProviderLogoProps> = ({
  provider,
  size = 18,
  className = '',
}) => {
  const norm = (provider || '').toLowerCase().trim();

  // OpenAI
  if (norm.includes('openai')) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={`provider-logo provider-openai ${className}`}
        aria-hidden="true"
      >
        <path d="M22.28 9.82a5.98 5.98 0 0 0-.51-4.91 6.05 6.05 0 0 0-6.51-2.9 6.06 6.06 0 0 0-5.28 2.17 5.98 5.98 0 0 0-4 2.9 6.05 6.05 0 0 0 .74 7.1 5.98 5.98 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.51 2.9A5.98 5.98 0 0 0 13.26 24a6.05 6.05 0 0 0 5.77-4.2 5.98 5.98 0 0 0 4-2.9 6.05 6.05 0 0 0-.75-7.08zm-9.02 12.6a4.48 4.48 0 0 1-2.88-1.04l.14-.08 4.78-2.76a.8.8 0 0 0 .4-.68v-6.74l2.01 1.17a.07.07 0 0 1 .04.05v5.58a4.5 4.5 0 0 1-4.49 4.5zm-9.66-4.12a4.47 4.47 0 0 1-.53-3.01l.14.08 4.78 2.76a.77.77 0 0 0 .78 0l5.85-3.37v2.33a.08.08 0 0 1-.03.06L9.74 19.95a4.5 4.5 0 0 1-6.14-1.65zM2.34 7.9a4.48 4.48 0 0 1 2.37-1.98V11.6a.77.77 0 0 0 .39.68l5.81 3.35-2.02 1.17a.08.08 0 0 1-.07 0L4 14.01a4.5 4.5 0 0 1-1.66-6.11zm16.6 3.85-5.84-3.38 2.02-1.17a.08.08 0 0 1 .07 0l4.83 2.8a4.5 4.5 0 0 1-.68 8.1V12.4a.8.8 0 0 0-.4-.66zm2.01-3.02-.14-.09-4.77-2.78a.78.78 0 0 0-.79 0L9.41 9.23V6.9a.07.07 0 0 1 .03-.06l4.83-2.79a4.5 4.5 0 0 1 6.68 4.66zM8.3 12.86l-2.01-1.16a.08.08 0 0 1-.04-.06V6.07a4.5 4.5 0 0 1 7.37-3.45l-.14.08L8.7 5.46a.8.8 0 0 0-.4.68zm1.1-2.36 2.6-1.5 2.61 1.5v3l-2.6 1.5-2.61-1.5z" />
      </svg>
    );
  }

  // Anthropic
  if (norm.includes('anthropic') || norm.includes('claude')) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={`provider-logo provider-anthropic ${className}`}
        aria-hidden="true"
      >
        <path d="M14.52 3.5h3.45L11.58 20.5H8.13L14.52 3.5zm-5.04 0H6.03L-.36 20.5h3.45l1.62-4.32h5.79l1.62 4.32h3.45L9.48 3.5zm-2.94 9.9 2.01-5.37 2.01 5.37H6.54z" />
      </svg>
    );
  }

  // Google / DeepMind / Gemini
  if (
    norm.includes('google') ||
    norm.includes('deepmind') ||
    norm.includes('gemini')
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={`provider-logo provider-google ${className}`}
        aria-hidden="true"
      >
        <path d="M12 24c0-6.627-5.373-12-12-12 6.627 0 12-5.373 12-12 0 6.627 5.373 12 12 12-6.627 0-12 5.373-12 12z" />
      </svg>
    );
  }

  // DeepSeek
  if (norm.includes('deepseek')) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={`provider-logo provider-deepseek ${className}`}
        aria-hidden="true"
      >
        <path d="M12 3C7.03 3 3 7.03 3 12c0 2.48 1.01 4.73 2.65 6.35l1.41-1.41C5.77 15.65 5 13.93 5 12c0-3.87 3.13-7 7-7s7 3.13 7 7c0 1.93-.77 3.65-2.06 4.94l1.41 1.41C20 16.73 21 14.48 21 12c0-4.97-4.03-9-9-9zm-1 5v6l5-3-5-3z" />
      </svg>
    );
  }

  // Meta AI / Llama
  if (norm.includes('meta') || norm.includes('llama')) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={`provider-logo provider-meta ${className}`}
        aria-hidden="true"
      >
        <path d="M16.96 4c-1.99 0-3.84 1.13-4.96 2.87C10.88 5.13 9.03 4 7.04 4 3.73 4 1 6.84 1 10.29c0 4.12 3.74 8.01 8.54 11.23.74.5 1.7.78 2.46.78s1.72-.28 2.46-.78C19.26 18.3 23 14.41 23 10.29 23 6.84 20.27 4 16.96 4zm-9.92 2.2c1.47 0 2.84.88 3.66 2.19-.94 1.46-1.78 3.11-2.43 4.88H5.97c-1.47 0-2.67-1.2-2.67-2.67 0-2.43 1.66-4.4 3.74-4.4zm9.92 0c2.08 0 3.74 1.97 3.74 4.4 0 1.47-1.2 2.67-2.67 2.67h-2.29c-.65-1.77-1.49-3.42-2.43-4.88.82-1.31 2.19-2.19 3.65-2.19z" />
      </svg>
    );
  }

  // xAI / Grok
  if (norm.includes('xai') || norm.includes('x-ai') || norm.includes('grok')) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={`provider-logo provider-xai ${className}`}
        aria-hidden="true"
      >
        <path d="M18.9 3h3.1L15.2 11.2l8 10.5h-6.2l-4.9-6.4-5.6 6.4H3.4l7.2-8.3L2.9 3h6.4l4.4 5.8L18.9 3zm-1.1 16.8h1.7L8.3 4.9H6.5l11.3 14.9z" />
      </svg>
    );
  }

  // Mistral AI
  if (norm.includes('mistral') || norm.includes('codestral')) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={`provider-logo provider-mistral ${className}`}
        aria-hidden="true"
      >
        <path d="M3 4h3.6v3.6H3V4zm5.4 0H12v3.6H8.4V4zm9 0H21v3.6h-3.6V4zM3 9.4h3.6V13H3V9.4zm5.4 0H12V13H8.4V9.4zm5.4 0h3.6V13h-3.6V9.4zm5.4 0H21V13h-3.6V9.4zM3 14.8h3.6v3.6H3v-3.6zm5.4 0H12v3.6H8.4v-3.6zm5.4 0h3.6v3.6h-3.6v-3.6zm5.4 0H21v3.6h-3.6v-3.6zM3 20.2h3.6v3.6H3v-3.6zm14.4 0H21v3.6h-3.6v-3.6z" />
      </svg>
    );
  }

  // Cohere
  if (norm.includes('cohere')) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={`provider-logo provider-cohere ${className}`}
        aria-hidden="true"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-5.5c0 .83-.67 1.5-1.5 1.5S7 15.33 7 14.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5zm7 0c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5z" />
      </svg>
    );
  }

  // Alibaba Cloud / Qwen
  if (norm.includes('alibaba') || norm.includes('qwen')) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={`provider-logo provider-alibaba ${className}`}
        aria-hidden="true"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5zm0 8.5L5.2 7.1 12 3.7l6.8 3.4L12 10.5zm-8 4l8 4 8-4v3l-8 4-8-4v-3zm0-4.5l8 4 8-4v3l-8 4-8-4v-3z" />
      </svg>
    );
  }

  // Amazon / AWS
  if (norm.includes('amazon') || norm.includes('aws')) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={`provider-logo provider-amazon ${className}`}
        aria-hidden="true"
      >
        <path d="M13.92 13.06c-1.42 0-2.31.74-2.31 1.94 0 1.15.82 1.87 2.11 1.87.97 0 1.83-.49 2.25-1.28v-1.89c-.58-.42-1.35-.64-2.05-.64zm4.18 5.61a.57.57 0 0 1-.54-.36l-.28-.86c-1.01.99-2.22 1.4-3.66 1.4-2.48 0-4.22-1.57-4.22-3.86 0-2.58 2.05-3.9 4.88-3.9.72 0 1.39.08 1.95.22v-.89c0-1.42-.9-2.18-2.51-2.18-.97 0-1.95.24-2.73.68a.56.56 0 0 1-.76-.2l-.66-1.16a.56.56 0 0 1 .2-.77c1.19-.68 2.65-1.04 4.19-1.04 3.16 0 4.88 1.63 4.88 4.67v5.52c0 .32.22.58.54.58.17 0 .34-.07.47-.19a.57.57 0 0 1 .8.08l.94 1.15c-.64.76-1.63 1.16-2.65 1.16-.34 0-.68-.06-1-.18l.04.16zM21.7 18.57c-2.49 1.84-5.94 2.8-9.08 2.8-4.28 0-8.15-1.54-11.08-4.11a.55.55 0 0 1 .05-.83.56.56 0 0 1 .78.07c2.72 2.37 6.32 3.8 10.25 3.8 2.87 0 6.03-.89 8.35-2.54a.56.56 0 0 1 .78.13.56.56 0 0 1-.05.68zm1.09-1.55c-.24-.31-1.6-.15-2.42-.05-.25.03-.29-.18-.06-.34 1.5-1.06 3.96-.75 4.26-.38.3.37-.08 2.84-1.5 3.99-.22.18-.39.08-.27-.15.39-.77.72-2.14.72-2.14l-.73-.93z" />
      </svg>
    );
  }

  // Generic AI Spark fallback
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`provider-logo provider-generic ${className}`}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3m0 14v3M2 12h3m14 0h3m-3.5-6.5-2.1 2.1m-8.8 8.8-2.1 2.1m0-13 2.1 2.1m8.8 8.8 2.1 2.1" />
    </svg>
  );
};
