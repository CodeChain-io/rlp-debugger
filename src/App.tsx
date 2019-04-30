import React from "react";
import * as RLP from "rlp";
import { hexDecoder, numberDecoder, stringDecoder, timestampDecoder } from "./decoders";

type AppState = {
  mode: "encoded" | "decoded";
  text: string;
  rlp: any;
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
      text: "",
      decodeButton: {
        disabled: true,
        label: "RLP is empty",
      },
      rlp: null,
    };
  }

  private handleTextChange = (e: any) => {
    const { value }: { value: string } = e.target;
    let text = value.replace(/\s/g, "");
    let rlp;
    let decodeButton;
    try {
      if (text.length === 0) {
        rlp = null;
        decodeButton = {
          disabled: true,
          label: "RLP is empty",
        };
      } else {
        if (text.startsWith("0x") === false) {
          text = "0x" + text;
        }
        rlp = RLP.decode(text);
        decodeButton = {
          disabled: false,
          label: "Decode",
        };
      }
    } catch (_) {
      rlp = null;
      decodeButton = {
        disabled: true,
        label: "RLP decode error",
      };
    }

    this.setState({
      mode: "encoded",
      text: value,
      rlp,
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
              value={this.state.text}
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
            <ListOrItem value={this.state.rlp} />
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

function ListOrItem({ value }: { value: any }) {
  if (Buffer.isBuffer(value)) {
    return <Item value={value} />;
  } else if (Array.isArray(value)) {
    return (
      <div>
        <div>[+] List({value.length})</div>
        <div style={{ marginLeft: "1rem" }}>
          {value.map((child, idx) => (
            <ListOrItem key={idx} value={child} />
          ))}
        </div>
      </div>
    );
  } else {
    throw new Error("Invalid type");
  }
}

type Type = "number" | "hex" | "string" | "timestamp";

interface ItemProps {
  value: Buffer;
}

interface ItemState {
  type: Type;
  decoded: {
    hex: string[] | null;
    string: string | null;
    number: string | null;
    timestamp: string | null;
  };
}

class Item extends React.Component<ItemProps, ItemState> {
  public constructor(props: ItemProps) {
    super(props);
    this.state = {
      type: "hex",
      decoded: {
        hex: hexDecoder(props.value, 4),
        string: stringDecoder(props.value),
        number: numberDecoder(props.value),
        timestamp: timestampDecoder(props.value)
      }
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
    if (this.state.type === 'hex') {
      return [
        <span key="prefix">0x</span>,
        this.state.decoded.hex!.map((x, idx) => <span key={idx} style={{ display: "inline-block", marginLeft: "0.5em" }}>{x}</span>)
      ]
    } else {
      return this.state.decoded[this.state.type];
    }
  }

  public render() {
    return (
      <div>
        <div>
          {this.renderSelector()}{" "}
          <span className="code">{this.renderDecoded()}</span>
        </div>
        <div />
      </div>
    );
  }
}

export default App;
