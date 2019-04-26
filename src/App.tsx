import React from "react";
import * as RLP from "rlp";

type AppState = {
  mode: "encoded" | "decoded";
  text: string;
  rlp: any;
};

class App extends React.Component<{}, AppState> {
  public constructor() {
    super({});
    this.state = {
      mode: "encoded",
      text: "",
      rlp: [],
    };
  }

  private handleTextChange = (e: any) => {
    this.setState({ mode: "encoded", text: e.target.value });
  };

  private handleClickDecode = () => {
    this.setState(state => {
      let rlp = RLP.decode(state.text);
      return { mode: "decoded", rlp };
    });
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
          <button id="decode-btn" className="decode" onClick={this.handleClickDecode}>
            Decode
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
