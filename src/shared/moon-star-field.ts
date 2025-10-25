import { html, css, LitElement, PropertyValues, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { Container } from '@tsparticles/engine';

@customElement('lunar-star-field')
export class LunarStarField extends LitElement {
  @property({ type: String }) private _id = `lunar-${Math.random().toString(36).substring(2, 10)}`;

  private _isLoaded = false;

  private _particleContainer?: Container;
  static _tsParticles?: typeof import('@tsparticles/engine').tsParticles;
  static _presetLoaded = false;

  private static async _ensureParticlesEngine(): Promise<typeof import('@tsparticles/engine').tsParticles> {
    if (!this._tsParticles) {
      const { tsParticles } = await import('@tsparticles/engine');
      const { loadStarsPreset } = await import('@tsparticles/preset-stars');

      await loadStarsPreset(tsParticles);
      this._tsParticles = tsParticles;
      this._presetLoaded = true;
    }

    return this._tsParticles!;
  }

  protected async firstUpdated(_changedProperties: PropertyValues): Promise<void> {
    super.firstUpdated(_changedProperties);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    // console.log(`First updated for LunarStarField with ID: ${this._id}`);
    this._loadParticles();
  }

  private async _loadParticles() {
    if (this._isLoaded) return;

    const particleElement = this.shadowRoot!.getElementById(this._id) as HTMLElement;

    const tsParticles = await LunarStarField._ensureParticlesEngine();

    const existing = tsParticles.dom().find((c) => c.id === Symbol.for(this._id));
    if (existing) {
      existing.destroy();
      console.log(`Destroyed existing particles container: ${this._id}`);
    }

    await new Promise((resolve) => requestAnimationFrame(resolve)); // Wait for render

    this._particleContainer = await tsParticles.load({
      id: this._id,
      element: particleElement,
      options: {
        preset: 'stars',
        autoPlay: true,
        background: {
          opacity: 1,
          color: {
            value: 'transparent',
          },
        },
        clear: true,
        delay: 0,
        fullScreen: {
          enable: false,
          zIndex: -1,
        },
        detectRetina: true,
        duration: 0,
        fpsLimit: 120,
        particles: {
          bounce: {
            horizontal: {
              value: 1,
            },
            vertical: {
              value: 1,
            },
          },
          collisions: {
            absorb: {
              speed: 2,
            },
            bounce: {
              horizontal: {
                value: 1,
              },
              vertical: {
                value: 1,
              },
            },
            enable: false,
            maxSpeed: 50,
            mode: 'bounce',
            overlap: {
              enable: true,
              retries: 0,
            },
          },

          effect: {
            close: true,
            fill: true,
            options: {},
            type: [],
          },
          groups: {},
          move: {
            angle: {
              offset: 0,
              value: 90,
            },
            attract: {
              distance: 200,
              enable: false,
              rotate: {
                x: 3000,
                y: 3000,
              },
            },
            center: {
              x: 50,
              y: 50,
              mode: 'percent',
              radius: 0,
            },
            decay: 0,
            distance: {},
            direction: 'none',
            drift: 0,
            enable: true,
            gravity: {
              acceleration: 9.81,
              enable: false,
              inverse: false,
              maxSpeed: 50,
            },
            path: {
              clamp: true,
              delay: {
                value: 0,
              },
              enable: false,
              options: {},
            },
            outModes: {
              default: 'out',
              bottom: 'out',
              left: 'out',
              right: 'out',
              top: 'out',
            },
            random: false,
            size: false,
            speed: {
              min: 0.1,
              max: 1,
            },
            spin: {
              acceleration: 0,
              enable: false,
            },
            straight: false,
            trail: {
              enable: false,
              length: 10,
              fill: {},
            },
            vibrate: false,
            warp: false,
          },
          number: {
            density: {
              enable: true,
              width: 1920,
              height: 1080,
            },
            limit: {
              mode: 'delete',
              value: 0,
            },
            value: 160,
          },
          opacity: {
            value: {
              min: 0.1,
              max: 0.5,
            },
            animation: {
              count: 0,
              enable: true,
              speed: 1,
              decay: 0,
              delay: 0,
              sync: false,
              mode: 'auto',
              startValue: 'random',
              destroy: 'none',
            },
          },
          reduceDuplicates: false,
          shape: {
            close: true,
            fill: true,
            options: {},
            type: 'circle',
          },
          size: {
            value: {
              min: 1,
              max: 3,
            },
          },
          stroke: {
            width: 0,
          },
          zIndex: {
            value: 0,
            opacityRate: 1,
            sizeRate: 1,
            velocityRate: 1,
          },
          destroy: {
            bounds: {},
            mode: 'none',
            split: {
              count: 1,
              factor: {
                value: 3,
              },
              rate: {
                value: {
                  min: 4,
                  max: 9,
                },
              },
              sizeOffset: true,
              particles: {},
            },
          },
          life: {
            count: 0,
            delay: {
              value: 0,
              sync: false,
            },
            duration: {
              value: 0,
              sync: false,
            },
          },

          repulse: {
            value: 0,
            enabled: true,
            distance: 1,
            duration: 1,
            factor: 1,
            speed: 1,
          },
        },
        pauseOnBlur: true,
        pauseOnOutsideViewport: true,
        smooth: true,
        zLayers: 100,
        motion: {
          disable: false,
          reduce: {
            factor: 4,
            value: true,
          },
        },
      },
    });

    this._isLoaded = true;
    // console.log(`Particles loaded for container: ${this._id}`);
  }

  static get styles() {
    return [
      css`
        :host {
          display: block;
          position: relative;
          width: 100%;
          height: 100%;
        }
        .lunar-particles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: -1;
        }
      `,
    ];
  }
  protected render(): TemplateResult {
    return html`<div id="${this._id}" class="lunar-particles"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lunar-star-field': LunarStarField;
  }
}
