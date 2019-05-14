import React from "react";
import * as RLP from "rlp";
import { hexDecoder, numberDecoder, stringDecoder, timestampDecoder } from "./decoders";

type AppState = {
  mode: "encoded" | "decoded";
  encodedText: string;
  plainText: any;
  decodeButton: {
    disabled: boolean;
    label: string;
  };
};

class App extends React.Component<{}, AppState> {
  public constructor() {
    super({});

    this.state = {
      mode: "encoded",
      encodedText: "",
      decodeButton: {
        disabled: true,
        label: "RLP is empty",
      },
      plainText: null,
    };
  }

  private handleTextChange = (e: any) => {
    const { value }: { value: string } = e.target;
    let text = value.replace(/\s/g, "");
    let plainText;
    let decodeButton;
    try {
      if (text.length === 0) {
        plainText = null;
        decodeButton = {
          disabled: true,
          label: "RLP is empty",
        };
      } else {
        if (text.startsWith("0x") === false) {
          text = "0x" + text;
        }
        plainText = RLP.decode(text);
        decodeButton = {
          disabled: false,
          label: "Decode",
        };
      }
    } catch (_) {
      plainText = null;
      decodeButton = {
        disabled: true,
        label: "RLP decode error",
      };
    }

    this.setState({
      mode: "encoded",
      encodedText: value,
      plainText,
      decodeButton,
    });
  };

  private handleClickDecode = () => {
    this.setState({ mode: "decoded" });
  };

  private handleClickEncode = () => {
    this.setState({ mode: "encoded" });
  };

  public render() {
    let body;
    if (this.state.mode === "encoded") {
      body = (
        <div className="App-body">
          <div>
            <textarea
              id="encoded-text"
              className="code"
              placeholder="RLP encoded hex string here"
              value={this.state.encodedText}
              onChange={this.handleTextChange}
            />
          </div>
          <button
            id="decode-btn"
            disabled={this.state.decodeButton.disabled}
            className="decode"
            onClick={this.handleClickDecode}
          >
            {this.state.decodeButton.label}
          </button>
        </div>
      );
    } else if (this.state.mode === "decoded") {
      body = (
        <div className="App-body">
          <div>
            <Item value={this.state.plainText} />
          </div>
          <button id="encode-btn" className="encode" onClick={this.handleClickEncode}>
            Encode
          </button>
        </div>
      );
    }

    return (
      <div className="App">
        <header className="App-header">
          <h1>RLP Debugger</h1>
        </header>
        {body}
      </div>
    );
  }
}

type Type = "number" | "hex" | "string" | "timestamp" | "list";

interface ItemProps {
  value: Buffer | Buffer[];
}

interface ItemState {
  type: Type;
  decoded: {
    hex: string[] | null;
    string: string | null;
    number: string | null;
    timestamp: string | null;
    [key: string]: string | string[] | null;
  };
  value: Buffer | Buffer[];
}

class Item extends React.Component<ItemProps, ItemState> {
  public constructor(props: ItemProps) {
    super(props);
    let type: Type;
    let decoded;

    if (Buffer.isBuffer(props.value)) {
      type = "hex";
      decoded = {
        hex: hexDecoder(props.value, 4),
        string: stringDecoder(props.value),
        number: numberDecoder(props.value),
        timestamp: timestampDecoder(props.value),
      };
    } else if (Array.isArray(props.value)) {
      type = "list";
      decoded = {
        hex: null,
        string: null,
        number: null,
        timestamp: null,
      };
    } else {
      throw Error("Invalid type");
    }

    this.state = {
      type,
      decoded,
      value: props.value,
    };
  }

  private handleSelectTypeChange = (e: any) => {
    const value: Type = e.target.value;
    this.setState({
      type: value,
    });
  };

  private renderSelector() {
    const types: Type[] = ["hex", "string", "number", "timestamp"];
    const options = types.map((type, index) => (
      <option key={index} value={type} disabled={this.state.decoded[type] === null}>
        {type}
      </option>
    ));
    return (
      <select value={this.state.type} onChange={this.handleSelectTypeChange}>
        {options}
      </select>
    );
  }

  public renderDecoded() {
    if (this.state.type === "hex") {
      return [
        <span key="prefix">0x</span>,
        this.state.decoded.hex!.map((x, idx) => (
          <span key={idx} style={{ display: "inline-block", marginLeft: "0.5em" }}>
            {x}
          </span>
        )),
      ];
    } else {
      return this.state.decoded[this.state.type];
    }
  }

  public render() {
    if (this.state.type === "list") {
      if (Array.isArray(this.state.value)) {
        return (
          <div>
            <div>[+] List({this.state.value.length})</div>
            <div style={{ marginLeft: "1rem" }}>
              {this.state.value.map((child, idx) => (
                <Item key={idx} value={child} />
              ))}
            </div>
          </div>
        );
      } else {
        throw Error("Invalid array value");
      }
    } else {
      return (
        <div>
          <div>
            {this.renderSelector()} <span className="code">{this.renderDecoded()}</span>
          </div>
          <div />
        </div>
      );
    }
  }
}

export default App;
