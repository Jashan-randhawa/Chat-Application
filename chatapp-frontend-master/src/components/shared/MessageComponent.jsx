/* eslint-disable react/prop-types */
import { Box, Typography } from "@mui/material";
import { memo } from "react";
import { lightBlue, orange, strongText } from "../../constants/color";
import moment from "moment";
import { fileFormat } from "../../lib/features";
import RenderAttachment from "./RenderAttachment";
import { motion } from "framer-motion";

const MessageComponent = ({ message, user }) => {
  const { sender, content, attachments = [], createdAt } = message;

  const sameSender = sender?._id === user?._id;

  const timeAgo = moment(createdAt).fromNow();

  return (
    <motion.div
      initial={{ opacity: 0, x: sameSender ? "20%" : "-20%" }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      style={{
        alignSelf: sameSender ? "flex-end" : "flex-start",
        backgroundColor: sameSender ? orange : "#ffffff",
        color: sameSender ? "#ffffff" : strongText,
        borderRadius: sameSender ? "1.1rem 1.1rem 0.3rem 1.1rem" : "1.1rem 1.1rem 1.1rem 0.3rem",
        padding: "0.7rem 0.92rem",
        width: "fit-content",
        maxWidth: "75%",
        boxShadow: "0 10px 24px rgba(17,26,52,0.14)",
      }}
    >
      {!sameSender && (
        <Typography color={lightBlue} fontWeight={700} variant="caption">
          {sender.name}
        </Typography>
      )}

      {content && (
        <Typography sx={{ wordBreak: "break-word", lineHeight: 1.5 }}>
          {content}
        </Typography>
      )}

      {attachments.length > 0 &&
        attachments.map((attachment, index) => {
          const url = attachment.url;
          const file = fileFormat(url);

          return (
            <Box key={index} mt={0.5}>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                download
                style={{
                  color: sameSender ? "#eef2ff" : strongText,
                }}
              >
                {RenderAttachment(file, url)}
              </a>
            </Box>
          );
        })}

      <Typography
        variant="caption"
        sx={{
          color: sameSender ? "rgba(255,255,255,0.82)" : "rgba(30,36,56,0.5)",
          display: "block",
          mt: 0.45,
          textAlign: "right",
          fontSize: "0.75rem",
          letterSpacing: "0.1px",
        }}
      >
        {timeAgo}
      </Typography>
    </motion.div>
  );
};

export default memo(MessageComponent);
