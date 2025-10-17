import { Template } from '../types';

export const templates: Template[] = [
  {
    id: 'minimal-professional',
    name: 'Minimal Professional',
    description: 'Clean, modern design with ample white space and elegant typography',
    preview_image: '/templates/minimal.png',
    styles: {
      fontFamily: 'Georgia',
      fontSize: {
        title: 36,
        heading: 18,
        body: 12
      },
      lineHeight: {
        title: 1.2,
        heading: 1.3,
        body: 1.6
      },
      margins: {
        top: 25,
        right: 20,
        bottom: 25,
        left: 20
      },
      colors: {
        text: '#2C3E50',
        heading: '#1A252F',
        accent: '#7F8C8D'
      }
    }
  },
  {
    id: 'creative-journal',
    name: 'Creative Journal',
    description: 'Artistic layout with expressive typography and vibrant accents',
    preview_image: '/templates/journal.png',
    styles: {
      fontFamily: 'Palatino',
      fontSize: {
        title: 42,
        heading: 20,
        body: 11
      },
      lineHeight: {
        title: 1.1,
        heading: 1.25,
        body: 1.7
      },
      margins: {
        top: 30,
        right: 25,
        bottom: 30,
        left: 25
      },
      colors: {
        text: '#34495E',
        heading: '#2C3E50',
        accent: '#E67E22'
      }
    }
  },
  {
    id: 'elegant-typography',
    name: 'Elegant Typography',
    description: 'Sophisticated serif fonts with balanced spacing and refined details',
    preview_image: '/templates/elegant.png',
    styles: {
      fontFamily: 'Times',
      fontSize: {
        title: 38,
        heading: 19,
        body: 11.5
      },
      lineHeight: {
        title: 1.15,
        heading: 1.3,
        body: 1.65
      },
      margins: {
        top: 28,
        right: 22,
        bottom: 28,
        left: 22
      },
      colors: {
        text: '#2C3A47',
        heading: '#1B2631',
        accent: '#5D6D7E'
      }
    }
  }
];

export const getTemplateById = (id: string): Template | undefined => {
  return templates.find(t => t.id === id);
};

export const getDefaultTemplate = (): Template => {
  return templates[0];
};
