import { useInputValidation } from "6pp";
import { Search as SearchIcon, Close as CloseIcon } from "@mui/icons-material";
import {
  Dialog, List,
  IconButton, Box, Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAsyncMutation } from "../../hooks/hook";
import { useLazySearchUserQuery, useSendFriendRequestMutation } from "../../redux/api/api";
import { setIsSearch } from "../../redux/reducers/misc";
import UserItem from "../shared/UserItem";
import useDebouncedValue from "../../hooks/useDebouncedValue";

const Search = () => {
  const { isSearch } = useSelector((state) => state.misc);
  const dispatch = useDispatch();

  const [searchUser] = useLazySearchUserQuery();
  const [sendFriendRequest, isLoadingSendFriendRequest] = useAsyncMutation(useSendFriendRequestMutation);

  const search = useInputValidation("");
  const debouncedSearch = useDebouncedValue(search.value, 300);
  const [users, setUsers] = useState([]);

  const addFriendHandler = async (id) => {
    await sendFriendRequest("Sending friend request...", { userId: id });
  };

  const searchCloseHandler = () => dispatch(setIsSearch(false));

  useEffect(() => {
    searchUser(debouncedSearch)
      .then(({ data }) => setUsers(data?.users || []))
      .catch(console.error);
  }, [debouncedSearch, searchUser]);

  return (
    <Dialog
      open={isSearch}
      onClose={searchCloseHandler}
      PaperProps={{
        sx: {
          borderRadius: { xs: "16px 16px 0 0", sm: "12px" },
          width: "100%",
          maxWidth: { xs: "100%", sm: 420 },
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          m: { xs: 0, sm: 2 },
          position: { xs: "fixed", sm: "relative" },
          bottom: { xs: 0, sm: "auto" },
          maxHeight: { xs: "90vh", sm: "80vh" },
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* WA-style green header */}
      <Box sx={{ bgcolor: "#008069", px: 2.5, py: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography sx={{
            color: "white", fontWeight: 600, fontSize: "1rem",
            fontFamily: "'Segoe UI', system-ui, sans-serif",
          }}>
            New Chat
          </Typography>
          <IconButton onClick={searchCloseHandler} size="small"
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
        <Box sx={{
          mt: 1.5, bgcolor: "rgba(255,255,255,0.15)",
          borderRadius: "8px", display: "flex", alignItems: "center", px: 1.5, py: 0.75,
        }}>
          <SearchIcon sx={{ color: "rgba(255,255,255,0.8)", fontSize: 18, mr: 1, flexShrink: 0 }} />
          <input
            placeholder="Search name or number"
            value={search.value}
            onChange={search.changeHandler}
            autoFocus
            aria-label="Search contacts"
            onKeyDown={(e) => {
              if (e.key === "Escape") searchCloseHandler();
            }}
            style={{
              border: "none", outline: "none", background: "transparent",
              color: "white", fontSize: "16px", width: "100%",
              fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}
          />
        </Box>
      </Box>

      {/* Results */}
      <Box sx={{ flex: 1, overflowY: "auto", maxHeight: { xs: "65vh", sm: 380 } }}>
        {users.length === 0 ? (
          <Box sx={{ py: 5, textAlign: "center" }}>
            <Typography sx={{ color: "#8696a0", fontSize: "0.875rem",
              fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
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
    </Dialog>
  );
};

export default Search;
