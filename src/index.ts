import './lunar-phase-card/lunar-phase-card';

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'lunar-phase-card',
  name: 'Lunar Phase Card',
  description: 'A card to display lunar phases and related information.',
  preview: true,
  documentationURL: 'https://github.com/ngocjohn/lunar-phase-card',
});
