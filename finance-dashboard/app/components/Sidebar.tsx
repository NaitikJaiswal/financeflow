
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  DashboardRounded,
  ReceiptLongRounded,
  AccountBalanceWalletRounded,
  SettingsRounded,
  LogoutRounded,
} from "@mui/icons-material";

import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";

const menuItems = [
  { label: "Dashboard", icon: <DashboardRounded />, href: "/dashboard" },
  {
    label: "Transactions",
    icon: <ReceiptLongRounded />,
    href: "/transactions",
  },
  {
    label: "Budgets",
    icon: <AccountBalanceWalletRounded />,
    href: "/budgets",
  },
  { label: "Settings", icon: <SettingsRounded />, href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("financeflow_token");
    router.push("/login");
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 250,
        flexShrink: 0,
        display: { xs: "none", md: "block" },
        "& .MuiDrawer-paper": {
          width: 250,
          boxSizing: "border-box",
          border: "none",
          borderRight: "1px solid #E9EDF4",
          backgroundColor: "#FFFFFF",
          p: 2,
        },
      }}
    >
      <Box sx={{ px: 1, py: 2, mb: 3 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 800, color: "#2563EB" }}
        >
          FinanceFlow
        </Typography>

        <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
          Personal finance
        </Typography>
      </Box>

      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => {
          const selected =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

          return (
            <ListItemButton
              key={item.label}
              component={Link}
              href={item.href}
              selected={selected}
              sx={{
                borderRadius: 2,
                mb: 1,
                color: selected ? "#2563EB" : "inherit",
                "&.Mui-selected": {
                  backgroundColor: "#EAF1FF",
                },
                "&.Mui-selected:hover": {
                  backgroundColor: "#DCE8FF",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: selected ? "#2563EB" : "#64748B",
                }}
              >
                {item.icon}
              </ListItemIcon>

              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>

      <List>
        <ListItemButton
          onClick={handleLogout}
          sx={{ borderRadius: 2 }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: "#64748B" }}>
            <LogoutRounded />
          </ListItemIcon>

          <ListItemText primary="Log out" />
        </ListItemButton>
      </List>
    </Drawer>
  );
}
