import React from "react";
import * as RLP from "rlp";
import { hexDecoder, numberDecoder, stringDecoder, timestampDecoder } from "./decoders";
import { hexEncoder, numberEncoder, stringEncoder, timestampEncoder } from "./encoders";
import { isNull } from "util";
import { Button } from "react-bootstrap";
import Footer from "./Footer/Footer";

type AppState = {
  mode: "encoded" | "decoded";
  encodedText: string;
  // Single source of truth for rlp decoded text.
  // If there are any changes in child components, they are lifted up to this source of truth
  plainText: any;
  decodeButton: {
    disabled: boolean;
    label: string;
  };
  encodeButton: {
    disabled: boolean;
    label: string;
  };
  // For re-rendering item list
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

    // Change the source of truth only when a change is valid
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

    // Re-render the source of truth if one of add, remove, list change occurs
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
          <div className="body">
            <textarea
              id="encoded-text"
              className="code form-control"
              placeholder="RLP encoded hex string here"
              value={this.state.encodedText}
              onChange={this.handleEncodedTextChange}
            />
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
          <Footer />
        </div>
      );
    } else if (this.state.mode === "decoded") {
      body = (
        <div className="App-body">
          <div className="body">
            <Item
              key={this.state.change ? "true" : "false"}
              idx={0}
              value={this.state.plainText}
              handler={this.handlePlainTextChange}
              fromList={false}
            />
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
          <Footer />
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

// String(number | hex | string | timestamp), List
type Type = "number" | "hex" | "string" | "timestamp" | "list";

// add - add element in front of corresponding element
// remove - remove the corresponding lement
// change - change a string to the list
type Edit = "add" | "remove" | "change" | "null";

interface ItemProps {
  value: Buffer | any[];
  // parent handler for lifting state up
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
  // temporary value which sync with the parent's state
  value: Buffer | any[] | null;
  // A set of indices which the corresponding is not valid
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
      const hexString = hexDecoder(props.value);
      decoded = {
        hex:
          hexString === null
            ? null
            : hexString.replace(/(\w{4})/g, "$1 ").replace(/(^\s+|\s+$)/, ""),
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

  // Handler for lifting state up
  private valueHandler = (
    index: number,
    value: any,
    disabled: boolean,
    edit: Edit,
    rebuild: boolean,
  ) => {
    // Only a list gets editing events from child elements
    if (this.state.type !== "list") {
      throw Error("Invalid type");
    }

    let itemValue = this.state.value as any[];
    let disabledSet = this.state.disabled;

    // Do nothing if editing event is invalid
    if (disabled) {
      this.props.handler(this.props.idx, itemValue, true, "null", rebuild);
      // Include the corresponding element into the invlid element list
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
      // Extract valid element's index which is not invalid anymore
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

    // sync between 4 options
    // If the changed value is invalid, only update the correspoding option's value and set null for others
    if (this.state.type === "hex") {
      console.log(value);
      hex = value;
      itemValue = hexEncoder(value.startsWith("0x") ? value : "0x" + value);

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

    // lift state up only when a valid change occurs
    if (itemValue === null) {
      this.props.handler(this.props.idx, itemValue, true, "null", false);
    } else {
      this.props.handler(this.props.idx, itemValue, false, "null", false);
    }
  };

  private handleSelectTypeChange = (e: any) => {
    let itemValue;
    if (e.target.value === "hex") {
      itemValue = this.state.decoded.hex === null ? null : hexEncoder(this.state.decoded.hex);
    } else if (e.target.value === "string") {
      itemValue =
        this.state.decoded.string === null ? null : stringEncoder(this.state.decoded.string);
    } else if (e.target.valid === "number") {
      itemValue =
        this.state.decoded.number === null ? null : numberEncoder(this.state.decoded.number);
    } else {
      itemValue =
        this.state.decoded.timestamp === null
          ? null
          : timestampEncoder(this.state.decoded.timestamp);
    }

    this.setState({
      type: e.target.value,
      value: itemValue,
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
      let decodedValue = this.state.decoded[this.state.type];
      if (decodedValue === null) {
        decodedValue = "";
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
