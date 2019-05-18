import React from "react";
import * as RLP from "rlp";
import { hexDecoder, numberDecoder, stringDecoder, timestampDecoder } from "./decoders";
import { hexEncoder, numberEncoder, stringEncoder, timestampEncoder } from "./encoders";
import { isNull } from "util";
import { Button } from "react-bootstrap";

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
  change: boolean;
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
      change: false,
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

  private handlePlainTextChange = (
    _: number,
    value: any,
    disabled: boolean,
    edit: Edit,
    rebuild: boolean,
  ) => {
    let encodeButton: any;
    let encodedText: any;
    let plain = value;

    if (!disabled) {
      if (edit === "change") {
        plain = [this.state.plainText];
      }

      try {
        encodedText = RLP.encode(plain).toString("hex");

        this.setState({
          encodedText,
          plainText: plain,
        });
      } catch (__) {
        encodeButton = {
          disabled: true,
          label: "RLP encode error",
        };
      }

      encodeButton = {
        disabled: false,
        label: "Encode",
      };
    } else {
      encodeButton = {
        disabled: true,
        label: "RLP encode error",
      };
    }

    this.setState({
      encodeButton,
    });

    if (rebuild) {
      this.setState((state, _props) => ({
        change: !state.change,
      }));
    }
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
              className="code form-control"
              placeholder="RLP encoded hex string here"
              value={this.state.encodedText}
              onChange={this.handleEncodedTextChange}
            />
          </div>
          <Button
            variant="primary"
            size="lg"
            block
            disabled={this.state.decodeButton.disabled}
            onClick={this.handleClickDecode}
          >
            {this.state.decodeButton.label}
          </Button>
        </div>
      );
    } else if (this.state.mode === "decoded") {
      body = (
        <div className="App-body">
          <div>
            <Item
              key={this.state.change ? "true" : "false"}
              idx={0}
              value={this.state.plainText}
              handler={this.handlePlainTextChange}
              fromList={false}
            />
          </div>
          <Button
            variant="primary"
            size="lg"
            block
            disabled={this.state.encodeButton.disabled}
            onClick={this.handleClickEncode}
          >
            {this.state.encodeButton.label}
          </Button>
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

type Edit = "add" | "remove" | "change" | "null";

interface ItemProps {
  value: Buffer | any[];
  handler: (index: number, value: any, disabled: boolean, edit: Edit, rebuild: boolean) => any;
  idx: number;
  fromList: boolean;
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

  private valueHandler = (
    index: number,
    value: any,
    disabled: boolean,
    edit: Edit,
    rebuild: boolean,
  ) => {
    if (this.state.type !== "list") {
      throw Error("Invalid type");
    }

    let itemValue = this.state.value as any[];
    let disabledSet = this.state.disabled;

    if (disabled) {
      this.props.handler(this.props.idx, itemValue, true, "null", rebuild);
      disabledSet.add(index);
    } else {
      if (edit === "null") {
        itemValue[index] = value;
      } else if (edit === "add") {
        itemValue.splice(index + 1, 0, Buffer.from("0x00", "hex"));
      } else if (edit === "remove") {
        itemValue.splice(index, 1);
      } else if (edit === "change") {
        if (Array.isArray(itemValue[index])) {
          throw Error("Invalid type");
        }

        itemValue[index] = [itemValue[index]];
      }
      disabledSet.delete(index);
      if (disabledSet.size === 0) {
        this.props.handler(this.props.idx, itemValue, false, "null", rebuild);
      } else {
        this.props.handler(this.props.idx, itemValue, true, "null", rebuild);
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
      console.log(value);
      hex = value;
      itemValue = hexEncoder(value);

      string = itemValue === null ? null : stringDecoder(itemValue);
      number = itemValue === null ? null : numberDecoder(itemValue);
      timestamp = itemValue === null ? null : timestampDecoder(itemValue);
    } else if (this.state.type === "string") {
      string = value;
      itemValue = stringEncoder(value);

      hex = itemValue === null ? null : hexDecoder(itemValue);
      number = itemValue === null ? null : numberDecoder(itemValue);
      timestamp = itemValue === null ? null : timestampDecoder(itemValue);
    } else if (this.state.type === "number") {
      number = value;
      itemValue = numberEncoder(value);

      hex = itemValue === null ? null : hexDecoder(itemValue);
      string = itemValue === null ? null : stringDecoder(itemValue);
      timestamp = itemValue === null ? null : timestampDecoder(itemValue);
    } else if (this.state.type === "timestamp") {
      timestamp = value;
      itemValue = timestampEncoder(value);

      hex = itemValue === null ? null : hexDecoder(itemValue);
      string = itemValue === null ? null : stringDecoder(itemValue);
      number = itemValue === null ? null : numberDecoder(itemValue);
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
      this.props.handler(this.props.idx, itemValue, true, "null", false);
    } else {
      this.props.handler(this.props.idx, itemValue, false, "null", false);
    }
  };

  private handleSelectTypeChange = (e: any) => {
    let itemValue;
    if (e.target.value === "hex") {
      itemValue = this.state.decoded.hex === null ? null : hexEncoder(this.state.decoded.hex)
    } else if (e.target.value === "string") {
      itemValue = this.state.decoded.string === null ? null : stringEncoder(this.state.decoded.string)
    } else if (e.target.valid === "number") {
      itemValue = this.state.decoded.number === null ? null : numberEncoder(this.state.decoded.number)
    } else {
      itemValue = this.state.decoded.timestamp === null ? null : timestampEncoder(this.state.decoded.timestamp)
    }

    this.setState({
      type: e.target.value,
      value: itemValue
    });

    this.props.handler(this.props.idx, itemValue, false, "null", false);
  };

  private renderSelector() {
    const types: Type[] = ["hex", "string", "number", "timestamp"];
    const options = types.map((type, index) => (
      <option key={index} value={type}>
        {type}
      </option>
    ));
    return (
      <select
        className="browser-default custom-select"
        value={this.state.type}
        onChange={this.handleSelectTypeChange}
      >
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

  private handleAdd = () => {
    this.props.handler(this.props.idx, null, false, "add", true);
  };

  private handleRemove = () => {
    this.props.handler(this.props.idx, null, false, "remove", true);
  };

  private handleChange = () => {
    this.props.handler(this.props.idx, null, false, "change", true);
  };

  private handleListAdd = () => {
    this.props.handler(this.props.idx, null, false, "add", true);
  };

  private handleListAddInsert = () => {
    let itemValue = this.state.value as any[];
    itemValue.splice(0, 0, Buffer.from("0x00", "hex"));
    this.props.handler(this.props.idx, itemValue, false, "null", true);
    this.setState({ value: itemValue });
  };

  private handleListRemove = () => {
    this.props.handler(this.props.idx, null, false, "remove", true);
  };

  public render() {
    if (this.state.type === "list") {
      if (Array.isArray(this.state.value)) {
        return (
          <div>
            <div style={{ height: "45px" }}>
              <div className="list">[+] List({this.state.value.length})</div>
              <div className="buttons">
                {this.props.fromList ? (
                  <Button variant="outline-primary" onClick={this.handleListAdd}>
                    +
                  </Button>
                ) : null}
                <Button
                  variant="outline-danger"
                  onClick={this.handleListRemove}
                  style={{ marginLeft: "0.5rem" }}
                >
                  -
                </Button>
              </div>
            </div>
            <div style={{ marginLeft: "1rem" }}>
              <Button variant="outline-info" onClick={this.handleListAddInsert}>
                +
              </Button>
              {this.state.value.map((child, idx) => (
                <Item
                  key={idx}
                  idx={idx}
                  value={child}
                  handler={this.valueHandler}
                  fromList={true}
                />
              ))}
            </div>
          </div>
        );
      } else {
        throw Error("Invalid type");
      }
    } else {
<<<<<<< Updated upstream
      let decodedValue = this.renderDecoded();
      decodedValue = decodedValue === null ? "" : decodedValue;
      if (this.state.type === "hex") {
        decodedValue = decodedValue.startsWith("0x") ? decodedValue : "0x" + decodedValue;
=======
      let decodedValue = this.state.decoded[this.state.type];
      if (decodedValue === null) {
        decodedValue = ""
>>>>>>> Stashed changes
      }

      return (
        <div>
          <div className="element">
            <div className="selector">{this.renderSelector()} </div>
            <div className="decoded-text">
              <input
                className="form-control"
                value={decodedValue}
                onChange={this.handleTextChange}
              />
            </div>
            {this.props.fromList ? (
              <div className="buttons">
                <Button variant="outline-primary" onClick={this.handleAdd}>
                  +
                </Button>
                <Button
                  variant="outline-danger"
                  onClick={this.handleRemove}
                  style={{ marginLeft: "0.5rem" }}
                >
                  -
                </Button>
              </div>
            ) : null}

            <div className="buttons">
              <Button
                variant="outline-success"
                onClick={this.handleChange}
                style={{ marginLeft: "0.5rem" }}
              >
                List
              </Button>
            </div>
          </div>
        </div>
      );
    }
  }
}

export default App;
