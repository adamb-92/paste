import type {StorybookConfig} from '@storybook/react-vite';
import {mergeConfig} from 'vite';
import path from 'path';

const config: StorybookConfig = {
  stories: [
    '../packages/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../performance-benchmarks/**/*.stories.@(js|jsx|ts|tsx|mdx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
    './addons/google-analytics/register',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {legacyRootApi: true},
  },
  features: {
    interactionsDebugger: true,
  },
  staticDirs: ['./static'],
  typescript: {
    // enable type checking
    check: true,
  },
  docs: {
    docsPage: 'automatic',
    defaultName: 'Docs',
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          gatsby: path.resolve(__dirname, './gatsby'),
        },
      },
      optimizeDeps: {
        include: ['@storybook/addon-viewport', 'chromatic/isChromatic', '@emotion/react/jsx-dev-runtime'],
      },
    });
  },
};

export default config;
