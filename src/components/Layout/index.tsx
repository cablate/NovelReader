'use client'

import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  SwipeableDrawer,
  Toolbar,
  Typography,
  makeStyles,
} from "@material-ui/core";
import BottomNavigationActionProps from "@material-ui/core/BottomNavigationAction";
import InboxIcon from "@mui/icons-material/Inbox";
import MailIcon from "@mui/icons-material/Mail";
import MenuIcon from "@mui/icons-material/Menu";
import RestoreIcon from "@mui/icons-material/Restore";
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined';
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import { ListItemButton } from "@mui/material";
import Link from "next/link";
import { SyntheticEvent, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SendCurrentPageName } from "@/utility/method";
export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname();
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);
  const [value, setValue] = useState('/recent');

  const headerRef = useRef<HTMLDivElement>(null);

  const useStyles = makeStyles(theme => ({
    MuiPaper: {
      "& .MuiPaper-root": {
        top: headerRef.current?.clientHeight || 0,
      }
    }
  }));
  const classes = useStyles();

  const[customPageName, setCustomPageName] = useState<string>('');
	useEffect(() => {
		document.addEventListener('PageNameUpdate', handleVideoUploaded);
		return () => {
			document.removeEventListener('PageNameUpdate', handleVideoUploaded);
		}
	}, [])

	const handleVideoUploaded:EventListener = (event) => {
		const customEvent = event as CustomEvent;
		const { name } = customEvent.detail;
		setCustomPageName(name);
	}

  useEffect(() => {
    window.location.pathname.split('/')[1] && setValue('/' + window.location.pathname.split('/')[1]);
  }, []);

  return (
    <div className="flex flex-col min-h-[100dvh] max-h-[100dvh]">
      <AppBar position="static" style={{height: '5%'}} ref={headerRef}>
        <Toolbar variant="dense">
          <IconButton edge="start" color="inherit" onClick={()=> setIsSideBarOpen((bool)=> !bool)}>
            {value.startsWith('/recent') && <RestoreIcon/>}
            {value.startsWith('/search') && <TravelExploreOutlinedIcon/>}
          </IconButton>

          <Typography component="div" style={{fontSize: '18px', fontWeight: 'bold', lineHeight: 'normal'}}>
            { customPageName || 
              (value === '/recent' && '最近閱讀') || 
              (value === '/search' && '常用網站')
            }
          </Typography>
        </Toolbar>

        {/* <SwipeableDrawer
          className={classes.MuiPaper}
          open={isSideBarOpen}
          onClose={function (event: SyntheticEvent<{}, Event>): void {
            setIsSideBarOpen(false);
          }}
          onOpen={function (event: SyntheticEvent<{}, Event>): void {
            setIsSideBarOpen(true);
          }}
        >
          <SideBar />
        </SwipeableDrawer> */}
      </AppBar>

      <div className="flex flex-1 overflow-y-auto">
        {children}
      </div>

      {!pathname.startsWith('/book') && 
        <BottomNavigation
          value={value}
          onChange={(event, newValue) => {
            if(value.startsWith(newValue)) return;
            setValue(newValue);
          }}
          showLabels
          className="font-bold"
        >
          <BottomNavigationAction label="最近閱讀" value={'/recent'} icon={<RestoreIcon />} onClick={()=> {setValue('/recent'); router.push('/recent'); }} />
          <BottomNavigationAction label="常用網站" value={'/search'} icon={<TravelExploreOutlinedIcon />} onClick={()=> {setValue('/search'); router.push('/search'); }}/>
          <BottomNavigationAction label="更多" icon={<MoreVertOutlinedIcon />} onClick={()=> alert('more')} />
        </BottomNavigation>
      }
    </div>
  );
}

function SideBar() {
  return (
    <Box sx={{ width: "250" }}>
      <List>
        {["Inbox", "Starred", "Send email", "Drafts"].map((text, index) => (
          <ListItem key={text}>
            <ListItemButton>
              <ListItemIcon>
                {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        {["All mail", "Trash", "Spam"].map((text, index) => (
          <ListItem key={text} style={{ padding: 0 }} >
            <ListItemButton style={{ padding: "8px 16px" }} LinkComponent={Link} href="/123">
              <ListItemIcon>
                {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
