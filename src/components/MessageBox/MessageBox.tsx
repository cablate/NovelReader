import { Dialog } from '@material-ui/core';
import React, { createContext, useContext } from 'react';
import ReactDOM from 'react-dom/client';

type TMessageBoxProps = {
  containerStyle?: React.CSSProperties;
  buttonContainerStyle?: React.CSSProperties;

  title?: string;
  childNode?: React.ReactNode;
  showInfoWrapper?: boolean;
  showButtonContainer?: boolean;
  message?: string;
  additionalMessage?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  zIndex?: number;
  imgUrl?: string;
}
const defaultProps: TMessageBoxProps = {
  message: '',
  additionalMessage: '',
  onConfirm: () => { },
  onCancel: () => { },
  zIndex: 100
}

const MessageBoxContext = createContext({} as {close: (value?: any) => void});

export function useMessageBoxContext() {
  return useContext(MessageBoxContext)
}

export default {
  open: (props: TMessageBoxProps) => {
    return new Promise((resolve, reject) => {

      const { title, childNode, showInfoWrapper, showButtonContainer, containerStyle, buttonContainerStyle, message, additionalMessage, confirmText, cancelText, onConfirm, onCancel, zIndex, imgUrl } = { ...defaultProps, ...props }
      const div = document.createElement('div');
      const root = document.querySelector('#root')!
      root.appendChild(div);
      const divRoot = ReactDOM.createRoot(div)

      function handleClose(value: any = null) {
        let result = value;
        divRoot.unmount();
        root.removeChild(div);
        resolve(result)
      }
      function handleConfirm() {
        handleClose(onConfirm?.())
      }
      function handleCancel() {
        handleClose(onCancel?.())
      }
      divRoot.render(
        <Dialog open={true}>
          <div style={containerStyle}>

            <div className={"header"}>
              <div className={"title"}>{title}</div>
              <div className={"close"} onClick={handleCancel}>
                <img src='/image/Clear1.svg'/>
              </div>
            </div>

            <MessageBoxContext.Provider value={{close: handleClose}}>
              {childNode}
            </MessageBoxContext.Provider>

            {showInfoWrapper && <div className={"infoWrapper"}>
              {imgUrl && <img src={imgUrl} alt="" />}
              {message && <div className={"message"}>{message}</div>}
              {additionalMessage && <div className={"additionalMessage"}>{additionalMessage}</div>}
            </div>
            }

            { showButtonContainer && 
              <div className={"buttonContainer"} style={buttonContainerStyle}>
                {cancelText && <button className='cancelBtn' onClick={handleCancel}>{cancelText}</button>}
                {confirmText && <button className='btnBlue3' onClick={handleConfirm}>{confirmText}</button>}
              </div>
            }
          </div>
        </Dialog>);
    })
  }
}