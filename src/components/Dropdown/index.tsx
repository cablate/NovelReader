import { CSSProperties, ReactElement, useCallback, useEffect, useRef, useState } from "react";
import style from "./index.module.scss";

interface Props{
  placement?: 'top' | 'top-left' | 'top-right' | 'bottom' | 'bottom-left' | 'bottom-right' | 'left-top' | 'left' | 'left-bottom' | 'right-top' | 'right' | 'right-bottom'
  arrow?: boolean
  hover?: boolean
  menu?: ReactElement
  children: ReactElement
  className?: string
  width?: number | 'inherit' | 'auto'
  height?: number
  appendTo?: 'button'
  onClose?: () => void

  stayEleAttr?: string
}

// 從事件中找到元素
const findAttrFromEvent = (event: React.MouseEvent<HTMLElement>| MouseEvent, attr: string) => {
  const currentTarget = event.currentTarget
  let target = event.target as Element;
  let result = null

  do{
    if(target != null && target.getAttribute(attr) != null) {
      result = target
      break
    };
    target = target.parentElement as Element
  }while(target && target.parentElement)

  return result
}


const Dropdown = (props: Props) => {
  const childrenRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState('translate(0px, 0px) translate(0px, 0px)');

  const placement = props.placement || 'bottom-right'
  const AppendTo = props.appendTo || 'portal'

  const handleOpen = () => {
    setIsOpen(true)
    getMenuPosition()
  }
  const handleClose = () => {
    setIsOpen(false)
    if(props.onClose){
      props.onClose()
    }
  }

  const getMenuPosition = () => {
    if(!childrenRef.current) return;
    const BTN = childrenRef.current.firstChild as HTMLElement
    // const BTN = childrenRef.current as HTMLElement
    const BTN_width = BTN.offsetWidth //按鈕寬
    const BTN_height = BTN.offsetHeight //按鈕高
    let BTN_X = 0
    let BTN_Y = 0
    if(AppendTo == 'portal'){
      BTN_X = BTN.getBoundingClientRect().y + window.pageYOffset  //按鈕絕對X軸
      BTN_Y = BTN.getBoundingClientRect().left + window.pageXOffset  //按鈕絕對Y軸
    }
    let menuX = BTN_X +'px',
        menuY = BTN_Y +'px'
    let offsetX = '0px',
        offsetY = '0px'
    switch(placement){
      case 'top':
        offsetX = `-100%`
        offsetY = `calc(${BTN_width/2}px - 50%)`
        break
      case 'top-left':
        offsetX = `-100%`
        break
      case 'top-right':
        offsetX = `-100%`
        offsetY = `calc(-100% + ${BTN_width}px)`
        break
      case 'bottom':
        offsetX = BTN_height + 'px'
        offsetY = `calc(${BTN_width/2}px - 50%)`
        break
      case 'bottom-left':
        offsetX = BTN_height + 'px'
        break
      case 'bottom-right':
        offsetX = BTN_height + 'px'
        offsetY = `calc(-100% + ${BTN_width}px)`
        break
      case 'left-top':
        offsetY = '-100%'
        break
      case 'left':
        offsetY = '-100%'
        offsetX = `calc(-50% + ${BTN_height/2}px)`
        break
      case 'left-bottom':
        offsetY = '-100%'
        offsetX = `calc(-100% + ${BTN_height}px)`
        break
      case 'right-top':
        offsetY = BTN_width + 'px'
        break
      case 'right':
        offsetY = BTN_width + 'px'
        offsetX = `calc(-50% + ${BTN_height/2}px)`
        break
      case 'right-bottom':
        offsetY = BTN_width + 'px'
        offsetX = `calc(-100% + ${BTN_height}px)`
        break
    }
    setMenuPosition(`translate(${menuY}, ${menuX}) translate(${offsetY}, ${offsetX})`)
  }

  const handleOnResize = () => {
    getMenuPosition()
  }

  const handleOnBodyClick = (e: React.MouseEvent<HTMLElement>| MouseEvent) => {
    if(props.hover === true) return

    const dropdownTarget = findAttrFromEvent(e, 'data-dropdown');
    if(dropdownTarget !== childrenRef.current){
      handleClose();
    }
  }

  useEffect(()=>{
    if(props.hover === true) return
    if(isOpen == false) return
    document.addEventListener('click', handleOnBodyClick);
    window.addEventListener('resize', handleOnResize);
    return () => {
      document.removeEventListener('click', handleOnBodyClick);
      window.removeEventListener('resize', handleOnResize);
    }
  }, [isOpen])

  const handleOnClick = (e: React.MouseEvent<HTMLElement>| MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if(e.currentTarget === childrenRef.current){
      isOpen ? handleClose() : handleOpen()
    }
  }

  const handleOnHover = (set: boolean) => {
    if(props.hover === true){
      set ? handleOpen() : handleClose()
    }
  }

  const menuContainerStyle:CSSProperties = {}
  if(props.width) {
    if(props.width === 'inherit' && childrenRef.current){ //繼承按鈕寬度
      const BTN = childrenRef.current.firstChild as HTMLElement
      const BTN_width = BTN.offsetWidth //按鈕寬
      menuContainerStyle.width = `${BTN_width}px`
    }else if(props.width === 'auto'){
      menuContainerStyle.width = `auto`
    }else{
      menuContainerStyle.width = `${props.width}px`
    }
  }
  if(props.height) menuContainerStyle.height = `${props.height}px`

  const menuWrapperStyle:CSSProperties = {
    // display: "inline-flex",
  }
  if(AppendTo == 'button') menuWrapperStyle.position = 'relative'

  return (
    <span ref={childrenRef}
        data-dropdown="dropdown"
        data-expanded={isOpen}
        onClick={handleOnClick}
        // onClickCapture={handleOnClick}
        onMouseEnter={() => handleOnHover(true)}
        onMouseLeave={() => handleOnHover(false)}
        className={props.className}
        style={menuWrapperStyle}
    >
      {props.children}
      {/* {
        (isOpen && AppendTo == 'portal') &&
        <Portal >
          <div className={style['dropdown']} style={{transform: menuPosition}} >
            <div className={style['dropdown-container']} style={menuContainerStyle}>
              {props.menu}
            </div>
          </div>
        </Portal>
      } */}
      {
        (isOpen && AppendTo == 'button') &&
          <div className={style['dropdown']} style={{transform: menuPosition}} >
            <div className={style['dropdown-container']} style={menuContainerStyle}>
              {props.menu}
            </div>
          </div>
      }
    </span>
  )
}

export default Dropdown