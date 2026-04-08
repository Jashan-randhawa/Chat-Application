import { useInputValidation } from "6pp";
import {
  Search as SearchIcon,
  Close as CloseIcon,
  People as PeopleIcon,
  Chat as ChatIcon,
} from "@mui/icons-material";
import {
  Box,
  IconButton,
  List,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAsyncMutation } from "../../hooks/hook";
import {
  useLazySearchUserQuery,
  useSendFriendRequestMutation,
} from "../../redux/api/api";
import { setIsSearch } from "../../redux/reducers/misc";
import UserItem from "../shared/UserItem";
import useDebouncedValue from "../../hooks/useDebouncedValue";
import ResponsiveDialog from "./ResponsiveDialog";

const TABS = [
  { label: "All", icon: <SearchIcon sx={{ fontSize: 16 }} /> },
  { label: "Users", icon: <PeopleIcon sx={{ fontSize: 16 }} /> },
  { label: "Chats", icon: <ChatIcon sx={{ fontSize: 16 }} /> },
];

const SearchDialog = () => {
  const { isSearch } = useSelector((state) => state.misc);
  const dispatch = useDispatch();

  const [searchUser] = useLazySearchUserQuery();
  const [sendFriendRequest, isLoadingSendFriendRequest] = useAsyncMutation(
    useSendFriendRequestMutation
  );

  const search = useInputValidation("");
  const debouncedSearch = useDebouncedValue(search.value, 300);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  const addFriendHandler = async (id) => {
    await sendFriendRequest("Sending friend request...", { userId: id });
  };

  const closeHandler = () => {
    dispatch(setIsSearch(false));
    search.changeHandler({ target: { value: "" } });
    setUsers([]);
    setActiveTab(0);
  };

  useEffect(() => {
    if (!isSearch) return;
    searchUser(debouncedSearch)
      .then(({ data }) => setUsers(data?.users || []))
      .catch(console.error);
  }, [debouncedSearch, searchUser, isSearch]);

  const paperSx = {
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
  };

  return (
    <ResponsiveDialog
      open={isSearch}
      onClose={closeHandler}
      drawerProps={{ PaperProps: { sx: paperSx } }}
      dialogProps={{
        PaperProps: {
          sx: { ...paperSx, maxWidth: 420, borderRadius: "12px" },
        },
      }}
    >
      {/* Header */}
      <Box sx={{ bgcolor: "#008069", px: 2.5, py: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography
            sx={{
              color: "white",
              fontWeight: 600,
              fontSize: "1rem",
              fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}
          >
            Search
          </Typography>
          <IconButton
            onClick={closeHandler}
            size="small"
            aria-label="Close search dialog"
            sx={{
              color: "rgba(255,255,255,0.8)",
              width: 44,
              height: 44,
              "&:hover": { color: "white" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Search input */}
        <Box
          sx={{
            mt: 1.5,
            bgcolor: "rgba(255,255,255,0.15)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            px: 1.5,
            py: 0.75,
          }}
        >
          <SearchIcon
            sx={{
              color: "rgba(255,255,255,0.8)",
              fontSize: 18,
              mr: 1,
              flexShrink: 0,
            }}
          />
          <input
            placeholder="Search name or number"
            value={search.value}
            onChange={search.changeHandler}
            autoFocus
            aria-label="Search contacts"
            onKeyDown={(e) => {
              if (e.key === "Escape") closeHandler();
            }}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              color: "white",
              fontSize: "16px",
              width: "100%",
              fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}
          />
          {search.value && (
            <IconButton
              size="small"
              onClick={() => search.changeHandler({ target: { value: "" } })}
              aria-label="Clear search"
              sx={{ color: "rgba(255,255,255,0.7)", p: 0.25 }}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>

        {/* Filter tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            mt: 1,
            minHeight: 36,
            "& .MuiTab-root": {
              color: "rgba(255,255,255,0.6)",
              minHeight: 36,
              textTransform: "none",
              fontSize: "0.8rem",
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              py: 0.5,
            },
            "& .Mui-selected": { color: "white !important" },
            "& .MuiTabs-indicator": { bgcolor: "white" },
          }}
        >
          {TABS.map((tab, i) => (
            <Tab
              key={tab.label}
              label={tab.label}
              id={`search-tab-${i}`}
              aria-controls={`search-tabpanel-${i}`}
              icon={tab.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Box>

      {/* Results */}
      <Box
        role="tabpanel"
        id={`search-tabpanel-${activeTab}`}
        aria-labelledby={`search-tab-${activeTab}`}
        sx={{
          flex: 1,
          overflowY: "auto",
          maxHeight: { xs: "60vh", sm: 360 },
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: "#d1d7db",
            borderRadius: 4,
          },
        }}
      >
        {users.length === 0 ? (
          <Box sx={{ py: 5, textAlign: "center" }}>
            <SearchIcon sx={{ fontSize: 40, color: "#d1d7db", mb: 1 }} />
            <Typography
              sx={{
                color: "#8696a0",
                fontSize: "0.875rem",
                fontFamily: "'Segoe UI', system-ui, sans-serif",
              }}
            >
              {search.value ? "No contacts found" : "Search for contacts to chat"}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {users.map((user) => (
              <UserItem
                user={user}
                key={user._id}
                handler={addFriendHandler}
                handlerIsLoading={isLoadingSendFriendRequest}
              />
            ))}
          </List>
        )}
      </Box>
    </ResponsiveDialog>
  );
};

export default SearchDialog;
