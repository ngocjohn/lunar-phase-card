import { capitalize } from 'es-toolkit';
import { css, CSSResultGroup, html, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { HaFormElement } from '../../../ha/panels/ha-form/types';
import { selectTree } from '../../../utils/helpers-dom';
import { BaseEditor } from '../base-editor';
import { ELEMENT } from '../editor-const';
import { APPEARANCE_LABELS, LABEL_PATH, LabelPathType } from '../translate-const';

const HA_FORM_STYLE = css`
  .root > :not([own-margin]):not(:last-child) {
    margin-bottom: 8px !important;
    margin-block-end: 8px !important;
  }
  .root ha-form-grid,
  .root ha-expansion-panel .root ha-form-grid {
    gap: 1em !important;
  }
  :host(.sectionOrder) .root ha-selector ha-selector-select {
    display: flex;
    flex-direction: column-reverse;
  }
`.toString();

@customElement('lpc-form-editor')
export class FormEditor extends BaseEditor {
  @property({ attribute: false }) data!: unknown;
  @property({ attribute: false }) schema!: unknown;
  @property() changed!: (ev: CustomEvent) => void;

  @query('#haForm') _haForm!: HaFormElement;

  protected async firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);
    await this.updateComplete;
    if (this._haForm.shadowRoot) {
      this._stylesManager.addStyle([HA_FORM_STYLE], this._haForm.shadowRoot);
      // this._changeChips();
    }
    this._addEventListeners();
  }

  protected render(): TemplateResult {
    return html`<ha-form
      id="haForm"
      .hass=${this._hass}
      .data=${this.data}
      .schema=${this.schema}
      .computeLabel=${this.computeLabel}
      .computeHelper=${this.computeHelper}
      @value-changed=${this.changed}
    ></ha-form>`;
  }

  private computeLabel = (schema: any): string | undefined => {
    if (schema.name === 'entity' && !schema.context?.group_entity) {
      return undefined;
    }
    if (['hide_compact_label', ...APPEARANCE_LABELS].includes(schema.name)) {
      return this.store.translate(`editor.${LABEL_PATH[schema.name as LabelPathType]}`);
    }
    const label = schema.label || schema.name || schema.title || '';
    return capitalize(label.replace(/_/g, ' '));
  };

  private computeHelper = (schema: any): string | TemplateResult | undefined => {
    if (APPEARANCE_LABELS.includes(schema.name)) {
      return this.store.translate(`editor.titleHelper.${LABEL_PATH[schema.name as LabelPathType]}`);
    }
    if (schema.name === 'hide_compact_label') {
      return this.store.translate(`editor.titleHelper.hideLabel`);
    }
    return schema.helper || undefined;
  };

  private _addEventListeners = async () => {
    const expandables = (await selectTree(
      this._haForm.shadowRoot,
      ELEMENT.FORM_EXPANDABLE,
      true
    )) as NodeListOf<HaFormElement>;
    if (expandables) {
      Array.from(expandables).forEach((el: any) => {
        (el.addEventListener('expanded-changed', this._expandableToggled.bind(this)), { once: true });
      });
    }
  };

  private _expandableToggled = async (ev: any) => {
    ev.stopPropagation();
    const target = ev.target;
    const expandedOpen = ev.detail.expanded as boolean;
    const styledAlready = target.getAttribute('data-processed') === 'true';

    if (!expandedOpen || styledAlready) {
      // If the panel is closed, do nothing
      return;
    }
    // Add custom styles to the expanded content
    if (target && target.shadowRoot) {
      const haFormRoot = await selectTree(target.shadowRoot, 'ha-expansion-panel ha-form');

      if (haFormRoot) {
        this._stylesManager.addStyle([HA_FORM_STYLE], haFormRoot.shadowRoot!);
      }
      target.setAttribute('data-processed', 'true');
    }
  };

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
        width: 100%;
        flex: 1 1 auto;
      }
      #haForm {
        display: flex;
        flex-direction: column;
        width: 100%;
        box-sizing: border-box;
        /* margin-block-end: 8px; */
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lpc-form-editor': FormEditor;
  }
}
