import React from "react";
import * as RLP from "rlp";

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
    let rlp;
    let decodeButton;
    try {
      if (value.trim().length === 0) {
        rlp = null;
        decodeButton = {
          disabled: true,
          label: "RLP is empty",
        };
      } else {
        rlp = RLP.decode(value.trim());
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
            <textarea id="encoded-text" placeholder="RLP encoded hex string here" value={this.state.text} onChange={this.handleTextChange} />
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

class Item extends React.Component<{ value: Buffer }> {
  public constructor(props: { value: Buffer }) {
    super(props);
  }

  public render() {
    return <p>{this.props.value.toString("hex")}</p>;
  }
}

export default App;
