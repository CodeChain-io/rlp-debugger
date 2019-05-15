import React from "react";
import * as RLP from "rlp";
import { hexDecoder, numberDecoder, stringDecoder, timestampDecoder } from "./decoders";
import { hexEncoder, numberEncoder, stringEncoder, timestampEncoder } from "./encoders";
import { isNull } from "util";

type AppState = {
  mode: "encoded" | "decoded";
  encodedText: string;
  plainText: any;
  decodeButton: {
    disabled: boolean;
    label: string;
  };
  encodeButton: {
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
      plainText: null,
      decodeButton: {
        disabled: true,
        label: "RLP is empty",
      },
      encodeButton: {
        disabled: false,
        label: "Encode",
      },
    };
  }

  private handleEncodedTextChange = (e: any) => {
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

  private handlePlainTextChange = (_: number, value: any, disabled: boolean) => {
    let encodeButton;
    let encodedText;

    if (!disabled) {
      try {
        encodedText = RLP.encode(value).toString("hex");
        this.setState({
          encodedText,
        });

        encodeButton = {
          disabled: false,
          label: "Encode",
        };
      } catch (__) {
        encodeButton = {
          disabled: true,
          label: "RLP encode error",
        };
      }
    } else {
      encodeButton = {
        disabled: true,
        label: "RLP encode error",
      };
    }

    this.setState({
      encodeButton,
      plainText: value,
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
              onChange={this.handleEncodedTextChange}
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
            <Item idx={0} value={this.state.plainText} handler={this.handlePlainTextChange} />
          </div>
          <button
            id="encode-btn"
            disabled={this.state.encodeButton.disabled}
            className="encode"
            onClick={this.handleClickEncode}
          >
            {this.state.encodeButton.label}
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
  value: Buffer | any[];
  handler: (index: number, value: any, disabled: boolean) => any;
  idx: number;
}

interface ItemState {
  type: Type;
  decoded: {
    hex: string | null;
    string: string | null;
    number: string | null;
    timestamp: string | null;
    [key: string]: string | null;
  };
  value: Buffer | any[] | null;
  disabled: Set<number>;
}

class Item extends React.Component<ItemProps, ItemState> {
  public constructor(props: ItemProps) {
    super(props);
    let type: Type;
    let decoded;

    if (Array.isArray(props.value)) {
      type = "list";
      decoded = {
        hex: null,
        string: null,
        number: null,
        timestamp: null,
      };
    } else if (Buffer.isBuffer(props.value)) {
      type = "hex";
      decoded = {
        hex: hexDecoder(props.value),
        string: stringDecoder(props.value),
        number: numberDecoder(props.value),
        timestamp: timestampDecoder(props.value),
      };
    } else if (isNull(props.value)) {
      type = "hex";
      decoded = {
        hex: "0x80",
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
      disabled: new Set(),
    };
  }

  private valueHandler = (index: number, value: any, disabled: boolean) => {
    if (this.state.type !== "list") {
      throw Error("Invalid type");
    }

    let itemValue = this.state.value as any[];
    itemValue[index] = value;
    let disabledSet = this.state.disabled;

    if (disabled) {
      this.props.handler(this.props.idx, itemValue, true);
      disabledSet.add(index);
    } else {
      disabledSet.delete(index);
      if (disabledSet.size === 0) {
        this.props.handler(this.props.idx, itemValue, false);
      } else {
        this.props.handler(this.props.idx, itemValue, true);
      }
    }

    this.setState({ value: itemValue, disabled: disabledSet });
  };

  private handleTextChange = (e: any) => {
    const { value }: { value: string } = e.target;
    let hex = this.state.decoded.hex;
    let string = this.state.decoded.string;
    let number = this.state.decoded.number;
    let timestamp = this.state.decoded.timestamp;
    let itemValue = this.state.value;

    if (this.state.type === "hex") {
      hex = value;
      itemValue = hexEncoder(value);
    } else if (this.state.type === "string") {
      string = value;
      itemValue = stringEncoder(value);
    } else if (this.state.type === "number") {
      number = value;
      itemValue = numberEncoder(value);
    } else if (this.state.type === "timestamp") {
      timestamp = value;
      itemValue = timestampEncoder(value);
    } else {
      throw Error("Invalid type");
    }

    this.setState({
      type: this.state.type,
      decoded: {
        hex,
        string,
        number,
        timestamp,
      },
      value: itemValue,
    });

    if (itemValue === null) {
      this.props.handler(this.props.idx, itemValue, true);
    } else {
      this.props.handler(this.props.idx, itemValue, false);
    }
  };

  private handleSelectTypeChange = (e: any) => {
    const value: Type = e.target.value;
    let itemValue;

    if (value === "hex") {
      itemValue = hexEncoder(this.state.decoded.hex as string);
    } else if (value === "string") {
      itemValue = stringEncoder(this.state.decoded.string as string);
    } else if (value === "number") {
      itemValue = numberEncoder(this.state.decoded.number as string);
    } else if (value === "timestamp") {
      itemValue = timestampEncoder(this.state.decoded.timestamp as string);
    } else {
      throw Error("Invalid type");
    }

    this.setState({
      type: value,
      decoded: {
        hex: this.state.decoded.hex,
        string: this.state.decoded.string,
        number: this.state.decoded.number,
        timestamp: this.state.decoded.timestamp,
      },
      value: itemValue,
    });

    if (itemValue === null) {
      this.props.handler(this.props.idx, itemValue, true);
    } else {
      this.props.handler(this.props.idx, itemValue, false);
    }
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
      return this.state.decoded.hex;
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
                <Item key={idx} idx={idx} value={child} handler={this.valueHandler} />
              ))}
            </div>
          </div>
        );
      } else {
        throw Error("Invalid type");
      }
    } else {
      let decodedValue = this.renderDecoded();
      decodedValue = decodedValue === null ? "" : decodedValue;
      if (this.state.type === "hex") {
        decodedValue = decodedValue.startsWith("0x") ? decodedValue : "0x" + decodedValue;
      }

      return (
        <div>
          <div>
            {this.renderSelector()}{" "}
            <span className="code">
              <textarea
                className="decoded-text"
                value={decodedValue}
                onChange={this.handleTextChange}
              />
            </span>
          </div>
          <div />
        </div>
      );
    }
  }
}

export default App;
