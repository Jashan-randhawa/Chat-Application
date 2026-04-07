// ============================================================
// REDESIGNED Search dialog — modern floating search panel
// Changes: dark-themed dialog, pill search input, user results
//          with avatar, smooth entry animation
// ============================================================

import { useInputValidation } from "6pp";
import { Search as SearchIcon, Close as CloseIcon } from "@mui/icons-material";
import {
  Dialog,
  DialogTitle,
  InputAdornment,
  List,
  Stack,
  TextField,
  IconButton,
  Box,
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

const Search = () => {
  const { isSearch } = useSelector((state) => state.misc);
  const [searchUser] = useLazySearchUserQuery();
  const [sendFriendRequest, isLoadingSendFriendRequest] = useAsyncMutation(
    useSendFriendRequestMutation
  );
  const dispatch = useDispatch();
  const search = useInputValidation("");
  const [users, setUsers] = useState([]);

  const addFriendHandler = async (id) => {
    await sendFriendRequest("Sending friend request...", { userId: id });
  };

  const searchCloseHandler = () => dispatch(setIsSearch(false));

  useEffect(() => {
    const timeOutId = setTimeout(() => {
      searchUser(search.value)
        .then(({ data }) => setUsers(data.users))
        .catch((e) => console.log(e));
    }, 1000);
    return () => clearTimeout(timeOutId);
  }, [search.value]);

  return (
    <Dialog
      open={isSearch}
      onClose={searchCloseHandler}
      PaperProps={{
        sx: {
          borderRadius: "20px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          minWidth: { xs: "90vw", sm: "400px" },
          overflow: "hidden",
        },
      }}
    >
      <Stack p={"1.5rem"} direction={"column"} spacing={2}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "1.1rem",
              color: "#f1f5f9",
              letterSpacing: "-0.02em",
            }}
          >
            Find People
          </Typography>
          <IconButton
            onClick={searchCloseHandler}
            size="small"
            sx={{
              color: "rgba(148,163,184,0.6)",
              "&:hover": { color: "#f1f5f9", bgcolor: "rgba(255,255,255,0.06)" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Search input */}
        <TextField
          placeholder="Search by name or username..."
          value={search.value}
          onChange={search.changeHandler}
          variant="outlined"
          size="small"
          autoFocus
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "rgba(148,163,184,0.5)", fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              bgcolor: "rgba(255,255,255,0.05)",
              color: "#f1f5f9",
              "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
              "&:hover fieldset": { borderColor: "rgba(14,165,233,0.4)" },
              "&.Mui-focused fieldset": { borderColor: "#0ea5e9" },
            },
            "& input::placeholder": { color: "rgba(148,163,184,0.5)", fontSize: "0.88rem" },
            "& input": { color: "#f1f5f9", fontSize: "0.9rem" },
          }}
        />

        {/* Results */}
        <List disablePadding sx={{ maxHeight: 320, overflowY: "auto",
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(255,255,255,0.1)", borderRadius: 4 },
        }}>
          {users.length === 0 && search.value && (
            <Box sx={{ py: 3, textAlign: "center" }}>
              <Typography sx={{ color: "rgba(148,163,184,0.5)", fontSize: "0.85rem" }}>
                No users found for "{search.value}"
              </Typography>
            </Box>
          )}
          {users.map((i) => (
            <UserItem
              user={i}
              key={i._id}
              handler={addFriendHandler}
              handlerIsLoading={isLoadingSendFriendRequest}
            />
          ))}
        </List>
      </Stack>
    </Dialog>
  );
};

export default Search;
