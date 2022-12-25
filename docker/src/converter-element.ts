import { LitElement, html, css } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import '@material/mwc-button/mwc-button.js';
import '@material/mwc-textarea/mwc-textarea.js';

import { DockerConverter } from "./docker.js";


@customElement('converter-element')
class ConverterElement extends LitElement {

  static styles = css`
  .docker {
  }

  .mdc-layout-grid__cell {
   margin: 16px; 
  }

  .mdc-layout-grid__inner
  {
    min-height: 850px;
    padding: 10px;
  }

  mwc-button {
    margin-inline-end: 16px;
  }
  `;

  @query('#container-name')
  containerName!: HTMLInputElement;

  @query('#input')
  input!: HTMLInputElement;

  @query('#output')
  output!: HTMLInputElement;

  render() {
    return html`
    <div class="mdc-layout-grid docker">
      <div class="mdc-layout-grid__inner">
        <div class="mdc-layout-grid__cell">
          <mwc-textfield type="text" label="New Container Name" place-holder="Leave empty to reuse existing" id="container-name"></mwc-textfield>
        </div>
        <div class="mdc-layout-grid__cell">
          <mwc-textarea label="docker inspect output" id="input" rows=10 cols=80></mwc-textarea>
        </div>
        <div class="mdc-layout-grid__cell">
          <mwc-button @click=${this.Generate} id="convert" label="Generate" raised></mwc-button>
          <mwc-button @click=${this.Clean} id="clean" label="Clean" raised></mwc-button>
        </div>
        <div class="mdc-layout-grid__cell">
          <mwc-textarea label="docker run command" id="output" rows=10 cols=80></mwc-textarea>
        </div>
      </div>
    </div>
    `;
  }

  Generate() {
    let converter;

    try {
      converter = new DockerConverter(this.input.value);
    }
    catch (err) {
      const msg = 'Parsing docker inspect output failed: ' + err;
      console.log(msg);
      this.output.value = msg;
      return;
    }

    const containerName = this.containerName.value;

    const result = converter.FormatCLI(containerName);
    if (result != null) {
      this.output.value = result;
    } else {
      this.output.value = "Conversion failed";
    }
  }

  Clean() {
    this.containerName.value = "";
    this.input.value = "";
    this.output.value = "";
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'converter-element': ConverterElement;
  }
}
