import React from 'react';

export interface ProviderLogoProps {
  provider: string;
  size?: number;
  className?: string;
}

export function getProviderLogoInfo(provider: string): {
  src: string;
  alt: string;
  invertOnLight?: boolean;
} {
  const norm = (provider || '').toLowerCase().trim();

  // OpenAI
  if (norm.includes('openai')) {
    return {
      src: '/logos/openai.png',
      alt: 'OpenAI logo',
      invertOnLight: true,
    };
  }

  // Anthropic / Claude
  if (norm.includes('anthropic') || norm.includes('claude')) {
    return {
      src: '/logos/anthropic.png',
      alt: 'Anthropic logo',
    };
  }

  // Google / DeepMind / Gemini
  if (
    norm.includes('google') ||
    norm.includes('deepmind') ||
    norm.includes('gemini')
  ) {
    return {
      src: '/logos/google.png',
      alt: 'Google DeepMind logo',
    };
  }

  // DeepSeek
  if (norm.includes('deepseek')) {
    return {
      src: '/logos/deepseek.png',
      alt: 'DeepSeek logo',
    };
  }

  // Meta AI / Llama
  if (norm.includes('meta') || norm.includes('llama')) {
    return {
      src: '/logos/meta.png',
      alt: 'Meta AI logo',
    };
  }

  // xAI / Grok
  if (norm.includes('xai') || norm.includes('x-ai') || norm.includes('grok')) {
    return {
      src: '/logos/xai.png',
      alt: 'xAI logo',
      invertOnLight: true,
    };
  }

  // Mistral AI
  if (norm.includes('mistral') || norm.includes('codestral')) {
    return {
      src: '/logos/mistral.png',
      alt: 'Mistral AI logo',
    };
  }

  // Cohere
  if (norm.includes('cohere')) {
    return {
      src: '/logos/cohere.png',
      alt: 'Cohere logo',
    };
  }

  // Alibaba Cloud / Qwen
  if (norm.includes('alibaba') || norm.includes('qwen')) {
    return {
      src: '/logos/qwen.png',
      alt: 'Alibaba Qwen logo',
    };
  }

  // Amazon / AWS
  if (norm.includes('amazon') || norm.includes('aws')) {
    return {
      src: '/logos/amazon.png',
      alt: 'Amazon AWS logo',
    };
  }

  return {
    src: '/logos/generic.png',
    alt: `${provider || 'AI'} logo`,
  };
}

export const ProviderLogo: React.FC<ProviderLogoProps> = ({
  provider,
  size = 18,
  className = '',
}) => {
  const { src, alt, invertOnLight } = getProviderLogoInfo(provider);

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`provider-logo-img ${invertOnLight ? 'provider-logo-invert-light' : ''} ${className}`}
      loading="lazy"
      decoding="async"
    />
  );
};
