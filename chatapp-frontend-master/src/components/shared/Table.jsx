/* eslint-disable react/prop-types */
import { DataGrid } from "@mui/x-data-grid";
import { Container, Paper, Typography, alpha, useTheme } from "@mui/material";

const Table = ({ rows, columns, heading, rowHeight = 52 }) => {
  const theme = useTheme();

  return (
    <Container sx={{ height: "100vh" }}>
      <Paper
        elevation={3}
        sx={{
          padding: { xs: "1rem", sm: "1rem 2rem", md: "1rem 4rem" },
          borderRadius: "1rem",
          margin: "auto",
          width: "100%",
          overflow: "hidden",
          height: "100%",
          boxShadow: "none",
        }}
      >
        <Typography
          textAlign="center"
          variant="h4"
          sx={{
            margin: "2rem",
            textTransform: "uppercase",
          }}
        >
          {heading}
        </Typography>
        <DataGrid
          rows={rows}
          columns={columns}
          rowHeight={rowHeight}
          style={{ height: "80%" }}
          sx={{
            border: "none",
            "& .table-header": {
              bgcolor: theme.palette.primary.dark,
              color: theme.palette.primary.contrastText,
            },
            "& .MuiDataGrid-row:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
            },
          }}
        />
      </Paper>
    </Container>
  );
};

export default Table;
