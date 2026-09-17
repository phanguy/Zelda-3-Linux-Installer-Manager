export const bashScript = `#!/bin/bash

# ==============================================================================
# 1. UNIVERSAL GUI WRAPPERS
# ==============================================================================

if command -v kdialog >/dev/null 2>&1; then
    GUI_TOOL="kdialog"
elif command -v zenity >/dev/null 2>&1; then
    GUI_TOOL="zenity"
else
    echo "Error: Neither kdialog nor zenity is installed. Please install one of them to use this graphical installer."
    exit 1
fi

gui_msgbox() {
    local text="$1"
    local title="$2"
    local formatted_text
    formatted_text=$(printf '%b' "$text")
    if [ "$GUI_TOOL" = "kdialog" ]; then
        kdialog --geometry 650x450 --msgbox "$formatted_text" --title "$title"
    else
        zenity --info --width=650 --height=450 --text="$formatted_text" --no-markup --title="$title" --ok-label="OK" 2>/dev/null
    fi
}

gui_error() {
    local text="$1"
    local title="$2"
    local formatted_text
    formatted_text=$(printf '%b' "$text")
    if [ "$GUI_TOOL" = "kdialog" ]; then
        kdialog --geometry 500x300 --error "$formatted_text" --title "$title"
    else
        zenity --error --width=500 --text="$formatted_text" --no-markup --title="$title" --ok-label="OK" 2>/dev/null
    fi
}

gui_yesno() {
    local text="$1"
    local title="$2"
    local formatted_text
    formatted_text=$(printf '%b' "$text")
    if [ "$GUI_TOOL" = "kdialog" ]; then
        kdialog --geometry 650x450 --yesno "$formatted_text" --title "$title"
    else
        zenity --question --width=650 --height=450 --text="$formatted_text" --no-markup --title="$title" --ok-label="OK" --cancel-label="Cancel" 2>/dev/null
    fi
}

gui_checklist() {
    local text="$1"
    local title="$2"
    local ok_btn="\${OK_LABEL:-OK}"
    local cancel_btn="\${CANCEL_LABEL:-Cancel}"
    local formatted_text
    formatted_text=$(printf '%b' "$text")
    shift 2
    
    if [ "$GUI_TOOL" = "kdialog" ]; then
        kdialog --geometry 900x800 --ok-label "$ok_btn" --cancel-label "$cancel_btn" --checklist "$formatted_text" "$@" --title "$title"
    else
        local zenity_args=()
        while [ $# -gt 0 ]; do
            local id="$1"
            local desc="$2"
            local status="$3"
            shift 3
            local z_status="FALSE"
            [ "$status" = "on" ] && z_status="TRUE"
            zenity_args+=("$z_status" "$id" "$desc")
        done
        local res
        res=$(zenity --list --checklist --width=900 --height=800 --title="$title" --text="$formatted_text" --no-markup \
            --ok-label="$ok_btn" --cancel-label="$cancel_btn" \
            --column="Select" --column="ID" --column="Description" --hide-column=2 --print-column=2 \
            "\${zenity_args[@]}" 2>/dev/null)
        local status=$?
        if [ $status -ne 0 ]; then
            return $status
        fi
        echo "$res"
    fi
}

gui_radiolist() {
    local text="$1"
    local title="$2"
    local ok_btn="\${OK_LABEL:-OK}"
    local cancel_btn="\${CANCEL_LABEL:-Cancel}"
    local formatted_text
    formatted_text=$(printf '%b' "$text")
    shift 2
    if [ "$GUI_TOOL" = "kdialog" ]; then
        kdialog --geometry 720x560 --ok-label "$ok_btn" --cancel-label "$cancel_btn" --radiolist "$formatted_text" "$@" --title "$title"
    else
        local zenity_args=()
        while [ $# -gt 0 ]; do
            local id="$1"
            local desc="$2"
            local status="$3"
            shift 3
            local z_status="FALSE"
            [ "$status" = "on" ] && z_status="TRUE"
            zenity_args+=("$z_status" "$id" "$desc")
        done
        zenity --list --radiolist --width=720 --height=560 --title="$title" --text="$formatted_text" --no-markup \
            --ok-label="$ok_btn" --cancel-label="$cancel_btn" \
            --column="Select" --column="ID" --column="Description" --hide-column=2 --print-column=2 \
            "\${zenity_args[@]}" 2>/dev/null
    fi
}

gui_getopenfilename() {
    local start_dir="$1"
    local filter="$2"
    local title="$3"
    if [ "$GUI_TOOL" = "kdialog" ]; then
        kdialog --geometry 800x600 --getopenfilename "$start_dir" "$filter" --title "$title"
    else
        # In GNOME / modern GTK, file chooser portals hide the window title.
        # We display an explicit instruction popup first so the user knows what to select.
        if ! zenity --info --width=450 --title="Action Required" \
            --text="$title\n\nClick OK to browse and select the file." --no-markup \
            --ok-label="OK" 2>/dev/null; then
            return 1
        fi
        zenity --file-selection --width=800 --height=600 --title="$title" --filename="$start_dir/" 2>/dev/null
    fi
}

gui_getexistingdirectory() {
    local start_dir="$1"
    local title="$2"
    if [ "$GUI_TOOL" = "kdialog" ]; then
        kdialog --geometry 800x600 --getexistingdirectory "$start_dir" --title "$title"
    else
        # In GNOME / modern GTK, file chooser portals hide the window title.
        # We display an explicit instruction popup first so the user knows what folder to choose.
        if ! zenity --info --width=450 --title="Action Required" \
            --text="$title\n\nClick OK to browse and select the folder." --no-markup \
            --ok-label="OK" 2>/dev/null; then
            return 1
        fi
        zenity --file-selection --directory --width=800 --height=600 --title="$title" --filename="$start_dir/" 2>/dev/null
    fi
}

gui_menu() {
    local text="$1"
    local title="$2"
    local ok_btn="\${OK_LABEL:-OK}"
    local cancel_btn="\${CANCEL_LABEL:-Cancel}"
    local formatted_text
    formatted_text=$(printf '%b' "$text")
    shift 2
    if [ "$GUI_TOOL" = "kdialog" ]; then
        kdialog --geometry 720x560 --ok-label "$ok_btn" --cancel-label "$cancel_btn" --menu "$formatted_text" "$@" --title "$title"
    else
        local zenity_args=()
        while [ $# -gt 0 ]; do
            zenity_args+=("$1" "$2")
            shift 2
        done
        zenity --list --width=720 --height=560 --title="$title" --text="$formatted_text" --no-markup \
            --ok-label="$ok_btn" --cancel-label="$cancel_btn" \
            --column="ID" --column="Action" --hide-column=1 --print-column=ALL \
            "\${zenity_args[@]}" 2>/dev/null
    fi
}


# ==============================================================================
# 2. CORE FUNCTIONS
# ==============================================================================

# --- HELPER: get value from zelda3.ini ---
get_ini() {
    local key="$1"
    local default_val="$2"
    local file="$3"
    if [ ! -f "$file" ]; then
        echo "$default_val"
        return
    fi
    local val
    val=$(grep -iE "^[# ]*\${key} *=" "$file" | head -n1 | sed -E "s|^[# ]*\${key} *= *||I" | tr -d '\r' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
    if [ -n "$val" ]; then
        echo "$val"
    else
        echo "$default_val"
    fi
}

# --- HELPER: update or add values in zelda3.ini ---
set_ini() {
    local key="$1"
    local val="$2"
    local file="$3"
    if grep -qiE "^[# ]*\${key} *=" "$file"; then
        sed -i -E "s|^[# ]*\${key} *=.*|\${key} = \${val}|I" "$file"
    else
        echo "\${key} = \${val}" >> "$file"
    fi
}

# --- SUBMENU: Bug Fixes & Exploits with built-in explanations ---
configure_bugfixes() {
    local ini_path="$1"
    while true; do
        local misc_val
        misc_val=$(get_ini "MiscBugFixes" "1" "$ini_path")
        local game_val
        game_val=$(get_ini "GameChangingBugFixes" "0" "$ini_path")

        local misc_status="DISABLED"
        if [ "$misc_val" == "1" ] || [ "$misc_val" == "true" ]; then misc_status="ENABLED"; fi

        local game_status="DISABLED"
        if [ "$game_val" == "1" ] || [ "$game_val" == "true" ]; then game_status="ENABLED"; fi

        local choice
        choice=$(gui_menu "Select an option below to view its explanation and change its value:" "Bug Fixes & Exploits" \
            "misc"  "🐛 MiscBugFixes: Engine, Boss & Audio/Visual Fixes (Currently: $misc_status)" \
            "game"  "⚡ GameChangingBugFixes: Sequence Breaks & Wall Clips (Currently: $game_status)" \
            "view"  "📋 View All Bug Fixes & Exploits Explained" \
            "done"  "💾 Save & Return to Categories")

        if [ $? -ne 0 ] || [ -z "$choice" ] || [[ "$choice" =~ "done" ]]; then
            break
        fi

        if [[ "$choice" =~ "view" ]]; then
            gui_msgbox "ZELDA 3 BUG FIXES & EXPLOITS GUIDE\n\n📌 Current Configuration:\n• MiscBugFixes: [ $misc_status ]\n• GameChangingBugFixes: [ $game_status ]\n\n──────────────────────────────────────\n🐛 MISC BUG FIXES (Engine & Boss Polish)\n• Mothula Boss: Fixes immunity to Tempered/Golden Sword spin\n• Glove Palette: Fixes Link's gauntlets reverting to bare hands\n• Ice Temple Chime: Restores missing discovery sound chime\n• Skull Woods Crash: Prevents crash when Somaria block is on switch\n• Magic Cape: Fixes magic not draining while pulling statues\n• Audio Stutter: Stops music from restarting on whirlpool warps\n• Kholdstare: Restores gradual melting animation on ice shell\n\n──────────────────────────────────────\n⚡ GAME-CHANGING BUG FIXES (Sequence Breaks)\n• Wall-Clipping: Patches classic ledge-jump & S&Q wall clips\n• Fake Flippers: Patches swimming in deep water without Flippers\n• Misaligned Entities: Fixes out-of-bounds entities (e.g. Ku in Swamp)\n\nSpeedrunners should keep GameChangingBugFixes DISABLED to preserve classic tricks." "Bug Fixes Reference"
        elif [[ "$choice" =~ "misc" ]]; then
            local def_1="off"; local def_2="off"
            if [ "$misc_status" == "ENABLED" ]; then def_1="on"; else def_2="on"; fi

            local misc_text
            misc_text=$(printf '%b' "MISC BUG FIXES (Engine & Audio/Visual Polish)\nCurrent Status: [ $misc_status ]\n\nFixes included when ENABLED:\n • Mothula Boss: Fixes immunity to Tempered/Golden Sword spin\n • Glove Palette: Fixes Link's gauntlets reverting to bare hands\n • Ice Temple Chime: Restores missing discovery sound chime\n • Skull Woods Crash: Prevents crash when Somaria block is on switch\n • Magic Cape: Fixes magic not draining while pulling statues\n • Audio Stutter: Stops music from restarting on whirlpool warps\n • Kholdstare: Restores gradual melting animation on ice shell")

            # Dedicated explainer dialog shown on both KDE and Zenity for full parity:
            if ! gui_yesno "$misc_text\n\nClick OK to change this setting, or Cancel to go back." "Configure: Misc Bug Fixes"; then
                continue
            fi

            local new_action
            new_action=$(gui_radiolist "Select setting for MiscBugFixes:" "Configure: Misc Bug Fixes" \
                "1" "ENABLE MiscBugFixes (Recommended - Polished experience)" "$def_1" \
                "0" "DISABLE MiscBugFixes (Keep original 1991 bugs)" "$def_2")

            if [ $? -eq 0 ] && [ -n "$new_action" ]; then
                if [ "$new_action" == "1" ] || [ "$new_action" == "0" ]; then
                    set_ini "MiscBugFixes" "$new_action" "$ini_path"
                    local state_str="DISABLED"
                    if [ "$new_action" == "1" ]; then state_str="ENABLED"; fi
                    gui_msgbox "MiscBugFixes is now $state_str!\n\nSaved to zelda3.ini." "Setting Saved"
                fi
            fi
        elif [[ "$choice" =~ "game" ]]; then
            local def_1="off"; local def_2="off"
            if [ "$game_status" == "ENABLED" ]; then def_1="on"; else def_2="on"; fi

            local game_text
            game_text=$(printf '%b' "GAME-CHANGING BUG FIXES (Sequence Breaks & Exploits)\nCurrent Status: [ $game_status ]\n\nExploits & quirks patched when ENABLED:\n • Wall-Clipping: Patches classic ledge-jump & S&Q wall clips\n • Fake Flippers: Patches swimming in deep water without Flippers\n • Misaligned Entities: Fixes out-of-bounds entities (e.g. Ku in Swamp)\n\nRecommended:\n • Keep DISABLED for classic speedrun glitches & vanilla physics.\n • Set to ENABLED for strict collision & zero sequence breaks.")

            # Dedicated explainer dialog shown on both KDE and Zenity for full parity:
            if ! gui_yesno "$game_text\n\nClick OK to change this setting, or Cancel to go back." "Configure: Game-Changing Bug Fixes"; then
                continue
            fi

            local new_action
            new_action=$(gui_radiolist "Select setting for GameChangingBugFixes:" "Configure: Game-Changing Bug Fixes" \
                "0" "DISABLE Fixes (Recommended for Speedruns - Keep Classic Glitches)" "$def_2" \
                "1" "ENABLE Fixes (Enforce strict collision & patch wall-clipping)" "$def_1")

            if [ $? -eq 0 ] && [ -n "$new_action" ]; then
                if [ "$new_action" == "1" ] || [ "$new_action" == "0" ]; then
                    set_ini "GameChangingBugFixes" "$new_action" "$ini_path"
                    local state_str="DISABLED"
                    if [ "$new_action" == "1" ]; then state_str="ENABLED"; fi
                    gui_msgbox "GameChangingBugFixes is now $state_str!\n\nSaved to zelda3.ini." "Setting Saved"
                fi
            fi
        fi
    done
}

# --- SUBMENU: Display & Graphics ---
configure_display() {
    local ini_path="$1"
    while true; do
        local cur_ar
        cur_ar=$(get_ini "ExtendedAspectRatio" "16:10" "$ini_path")
        local cur_fs
        cur_fs=$(get_ini "Fullscreen" "1" "$ini_path")
        local fs_str="Fullscreen"
        if [ "$cur_fs" == "0" ]; then fs_str="Windowed"; fi
        local cur_scale
        cur_scale=$(get_ini "WindowScale" "3" "$ini_path")
        local cur_filt
        cur_filt=$(get_ini "LinearFiltering" "0" "$ini_path")
        local filt_str="Crisp Retro (Nearest)"
        if [ "$cur_filt" == "1" ]; then filt_str="Smooth (Bilinear)"; fi
        local cur_flashes
        cur_flashes=$(get_ini "DimFlashes" "0" "$ini_path")
        local flashes_str="Original Flashes"
        if [ "$cur_flashes" == "1" ]; then flashes_str="Dimmed (Photosensitive Safe)"; fi

        local choice
        choice=$(gui_menu "Select a display option below to modify:" "Display & Graphics Settings" \
            "aspect"     "📐 Aspect Ratio (Current: $cur_ar)" \
            "fullscreen" "🖥️ Screen Mode: Toggle Fullscreen / Windowed (Current: $fs_str)" \
            "scale"      "🔍 Window Scale: 1x, 2x, 3x, 4x (Current: \${cur_scale}x)" \
            "filter"     "🎨 Pixel Filter: Toggle Crisp / Smooth (Current: $filt_str)" \
            "flashes"    "⚡ Dim Flashes: Toggle Photosensitivity Guard (Current: $flashes_str)" \
            "done"       "💾 Save & Return to Categories")

        if [ $? -ne 0 ] || [ -z "$choice" ] || [[ "$choice" =~ "done" ]]; then
            break
        fi

        if [[ "$choice" =~ "aspect" ]]; then
            local ar_16_10_on="off"; local ar_16_9_on="off"; local ar_4_3_on="off"; local ar_18_9_on="off"
            if [ "$cur_ar" == "16:9" ]; then ar_16_9_on="on";
            elif [ "$cur_ar" == "4:3" ]; then ar_4_3_on="on";
            elif [ "$cur_ar" == "18:9" ]; then ar_18_9_on="on";
            else ar_16_10_on="on"; fi

            local sel_ar
            sel_ar=$(gui_radiolist "Select your preferred display aspect ratio:" "Aspect Ratio" \
                "16:10" "16:10 (Steam Deck Native - Full screen without borders)" "$ar_16_10_on" \
                "16:9" "16:9 (Standard Widescreen PC Monitors & Modern TVs)" "$ar_16_9_on" \
                "4:3" "4:3 (Original 1991 Retro SNES ratio with pillarboxes)" "$ar_4_3_on" \
                "18:9" "18:9 (Ultra-wide 2:1 displays)" "$ar_18_9_on")
            if [ $? -eq 0 ] && [ -n "$sel_ar" ]; then
                set_ini "ExtendedAspectRatio" "$sel_ar" "$ini_path"
                gui_msgbox "Aspect Ratio set to $sel_ar!\n\nSaved to zelda3.ini." "Updated"
            fi
        elif [[ "$choice" =~ "fullscreen" ]]; then
            local new_fs="1"
            if [ "$cur_fs" == "1" ]; then new_fs="0"; fi
            set_ini "Fullscreen" "$new_fs" "$ini_path"
            local new_fs_str="Fullscreen"
            if [ "$new_fs" == "0" ]; then new_fs_str="Windowed"; fi
            gui_msgbox "Display mode set to $new_fs_str!\n\nSaved to zelda3.ini." "Updated"
        elif [[ "$choice" =~ "scale" ]]; then
            local sc_1="off"; local sc_2="off"; local sc_3="off"; local sc_4="off"
            if [ "$cur_scale" == "1" ]; then sc_1="on";
            elif [ "$cur_scale" == "2" ]; then sc_2="on";
            elif [ "$cur_scale" == "4" ]; then sc_4="on";
            else sc_3="on"; fi

            local sel_scale
            sel_scale=$(gui_radiolist "Select window scale multiplier (used in Windowed mode):" "Window Scale" \
                "1" "1x (256x224 - Original SNES resolution)" "$sc_1" \
                "2" "2x (512x448)" "$sc_2" \
                "3" "3x (768x672 - Recommended for 1080p)" "$sc_3" \
                "4" "4x (1024x896 - Recommended for 1440p / 4K)" "$sc_4")
            if [ $? -eq 0 ] && [ -n "$sel_scale" ]; then
                set_ini "WindowScale" "$sel_scale" "$ini_path"
                gui_msgbox "Window scale set to \${sel_scale}x!\n\nSaved to zelda3.ini." "Updated"
            fi
        elif [[ "$choice" =~ "filter" ]]; then
            local new_filt="1"
            if [ "$cur_filt" == "1" ]; then new_filt="0"; fi
            set_ini "LinearFiltering" "$new_filt" "$ini_path"
            local new_f_str="Smooth Bilinear"
            if [ "$new_filt" == "0" ]; then new_f_str="Crisp Retro (Nearest Neighbor)"; fi
            gui_msgbox "Pixel filter set to $new_f_str!\n\nSaved to zelda3.ini." "Updated"
        elif [[ "$choice" =~ "flashes" ]]; then
            local new_flashes="1"
            if [ "$cur_flashes" == "1" ]; then new_flashes="0"; fi
            set_ini "DimFlashes" "$new_flashes" "$ini_path"
            local new_fl_str="Dimmed Flashes (Photosensitive safe)"
            if [ "$new_flashes" == "0" ]; then new_fl_str="Original Flashes"; fi
            gui_msgbox "Flashing effect set to $new_fl_str!\n\nSaved to zelda3.ini." "Updated"
        fi
    done
}

# --- SUBMENU: Gameplay & Quality of Life ---
configure_gameplay() {
    local ini_path="$1"
    local qol_keys=("ItemSwitchLR" "TurnWhileDashing" "BreakPotsWithSword" "CollectItemsWithSword" "DisableLowHealthBeep" "CancelBirdTravel" "ShowMaxItemsInYellow" "SkipIntroOnKeypress" "MoreActiveBombs" "EnhancedMode7" "MirrorToDarkworld" "CarryMoreRupees")

    while true; do
        # Count currently enabled features
        local count=0
        for k in "\${qol_keys[@]}"; do
            local val
            val=$(get_ini "$k" "0" "$ini_path")
            if [ "$val" == "1" ] || [ "$val" == "true" ]; then
                ((count++))
            fi
        done

        local choice
        choice=$(gui_menu "Select an option below to customize features or quickly toggle all:" "Gameplay & QoL Tweaks" \
            "checklist"    "✏️ Customize Features (Checklist: $count of 12 Enabled)" \
            "select_all"   "✅ Select All (Enable all 12 QoL features)" \
            "deselect_all" "❌ Deselect All (Disable all features / Vanilla 1991)" \
            "defaults"     "⭐ Recommended Defaults (Standard QoL Pack: 9 of 12)" \
            "done"         "💾 Save & Return to Categories")

        if [ $? -ne 0 ] || [ -z "$choice" ] || [[ "$choice" =~ "done" ]]; then
            break
        fi

        if [[ "$choice" =~ "select_all" ]]; then
            for feat in "\${qol_keys[@]}"; do
                set_ini "$feat" "1" "$ini_path"
            done
            gui_msgbox "All 12 Quality of Life features are now ENABLED!\n\nSaved to zelda3.ini." "All Features Enabled"
        elif [[ "$choice" =~ "deselect_all" ]]; then
            for feat in "\${qol_keys[@]}"; do
                set_ini "$feat" "0" "$ini_path"
            done
            gui_msgbox "All Quality of Life features have been DISABLED!\nOriginal 1991 SNES behavior restored.\n\nSaved to zelda3.ini." "All Features Disabled"
        elif [[ "$choice" =~ "defaults" ]]; then
            set_ini "ItemSwitchLR" "1" "$ini_path"
            set_ini "TurnWhileDashing" "1" "$ini_path"
            set_ini "BreakPotsWithSword" "1" "$ini_path"
            set_ini "CollectItemsWithSword" "1" "$ini_path"
            set_ini "DisableLowHealthBeep" "1" "$ini_path"
            set_ini "CancelBirdTravel" "1" "$ini_path"
            set_ini "ShowMaxItemsInYellow" "1" "$ini_path"
            set_ini "SkipIntroOnKeypress" "1" "$ini_path"
            set_ini "EnhancedMode7" "1" "$ini_path"
            set_ini "MoreActiveBombs" "0" "$ini_path"
            set_ini "MirrorToDarkworld" "0" "$ini_path"
            set_ini "CarryMoreRupees" "0" "$ini_path"
            gui_msgbox "Recommended defaults restored (9 standard QoL enabled, balance tweaks untouched)!\n\nSaved to zelda3.ini." "Defaults Restored"
        elif [[ "$choice" =~ "checklist" ]]; then
            # Read current states to pre-populate checklist correctly
            local c_ItemSwitchLR=$(get_ini "ItemSwitchLR" "1" "$ini_path")
            local c_TurnWhileDashing=$(get_ini "TurnWhileDashing" "1" "$ini_path")
            local c_BreakPotsWithSword=$(get_ini "BreakPotsWithSword" "1" "$ini_path")
            local c_CollectItemsWithSword=$(get_ini "CollectItemsWithSword" "1" "$ini_path")
            local c_DisableLowHealthBeep=$(get_ini "DisableLowHealthBeep" "1" "$ini_path")
            local c_CancelBirdTravel=$(get_ini "CancelBirdTravel" "1" "$ini_path")
            local c_ShowMaxItemsInYellow=$(get_ini "ShowMaxItemsInYellow" "1" "$ini_path")
            local c_SkipIntroOnKeypress=$(get_ini "SkipIntroOnKeypress" "1" "$ini_path")
            local c_MoreActiveBombs=$(get_ini "MoreActiveBombs" "0" "$ini_path")
            local c_EnhancedMode7=$(get_ini "EnhancedMode7" "1" "$ini_path")
            local c_MirrorToDarkworld=$(get_ini "MirrorToDarkworld" "0" "$ini_path")
            local c_CarryMoreRupees=$(get_ini "CarryMoreRupees" "0" "$ini_path")

            s_on() { if [ "$1" == "1" ] || [ "$1" == "true" ]; then echo "on"; else echo "off"; fi; }

            local tweaks
            tweaks=$(gui_checklist "Toggle gameplay and Quality of Life features:\n(Checked items will be saved as ENABLED in zelda3.ini)" "Gameplay & QoL Tweaks" \
                "ItemSwitchLR" "Quick item swap (L/R) & Reorder Inventory (Y + Arrows)" "$(s_on "$c_ItemSwitchLR")" \
                "TurnWhileDashing" "Turn corners while dashing with Pegasus Boots" "$(s_on "$c_TurnWhileDashing")" \
                "BreakPotsWithSword" "Break ceramic pots with Master Sword" "$(s_on "$c_BreakPotsWithSword")" \
                "CollectItemsWithSword" "Pick up hearts, rupees, and bombs with sword slash" "$(s_on "$c_CollectItemsWithSword")" \
                "DisableLowHealthBeep" "Mute the constant low-health alarm beep" "$(s_on "$c_DisableLowHealthBeep")" \
                "CancelBirdTravel" "Cancel bird flute flight immediately with X button" "$(s_on "$c_CancelBirdTravel")" \
                "ShowMaxItemsInYellow" "Highlight maxed bombs, arrows, and rupees in yellow text" "$(s_on "$c_ShowMaxItemsInYellow")" \
                "SkipIntroOnKeypress" "Skip opening intro sequence by pressing any button" "$(s_on "$c_SkipIntroOnKeypress")" \
                "MoreActiveBombs" "Allow up to 4 active bombs at once instead of 2" "$(s_on "$c_MoreActiveBombs")" \
                "EnhancedMode7" "Higher quality world map and perspective 3D rendering" "$(s_on "$c_EnhancedMode7")" \
                "MirrorToDarkworld" "Allow Magic Mirror to warp back TO the Dark World" "$(s_on "$c_MirrorToDarkworld")" \
                "CarryMoreRupees" "Increase maximum wallet capacity to 9999 rupees" "$(s_on "$c_CarryMoreRupees")")
            local cl_status=$?

            if [ $cl_status -ne 0 ]; then
                # User clicked Cancel - exit back without altering settings or displaying saved notification
                continue
            fi

            for feat in "\${qol_keys[@]}"; do
                if [[ "$tweaks" =~ "$feat" ]]; then
                    set_ini "$feat" "1" "$ini_path"
                else
                    set_ini "$feat" "0" "$ini_path"
                fi
            done
            gui_msgbox "Gameplay tweaks successfully saved to zelda3.ini!" "Settings Saved"
        fi
    done
}

# --- SUBMENU: Audio & MSU-1 Setup ---
configure_audio() {
    local ini_path="$1"
    local game_dir
    game_dir=$(dirname "$ini_path")

    while true; do
        local cur_msu
        cur_msu=$(get_ini "EnableMSU" "false" "$ini_path")
        local msu_str="DISABLED"
        if [ "$cur_msu" == "true" ] || [ "$cur_msu" == "1" ]; then msu_str="ENABLED"; fi
        local cur_freq
        cur_freq=$(get_ini "AudioFreq" "44100" "$ini_path")
        local cur_chan
        cur_chan=$(get_ini "AudioChannels" "2" "$ini_path")
        local chan_str="Stereo (2 Channels)"
        if [ "$cur_chan" == "1" ]; then chan_str="Mono (1 Channel)"; fi

        local choice
        choice=$(gui_menu "Select an audio option below to modify:" "Audio Settings" \
            "toggle_msu"  "🎵 Toggle MSU-1 Audio (Currently: $msu_str)" \
            "install_msu" "📦 Install / Extract an MSU-1 Audio Pack (.zip, .7z, or folder)" \
            "freq"        "🔊 Sample Rate: 44100 Hz / 48000 Hz (Current: \${cur_freq} Hz)" \
            "channels"    "🎧 Channels: Toggle Stereo / Mono (Current: $chan_str)" \
            "done"        "💾 Save & Return to Categories")

        if [ $? -ne 0 ] || [ -z "$choice" ] || [[ "$choice" =~ "done" ]]; then
            break
        fi

        if [[ "$choice" =~ "toggle_msu" ]]; then
            local new_msu="true"
            if [ "$msu_str" == "ENABLED" ]; then new_msu="false"; fi
            set_ini "EnableMSU" "$new_msu" "$ini_path"
            local new_msu_str="DISABLED"
            if [ "$new_msu" == "true" ]; then
                new_msu_str="ENABLED"
                mkdir -p "$game_dir/msu"
            fi
            gui_msgbox "MSU-1 Audio is now $new_msu_str!\n\nSaved to zelda3.ini." "Audio Updated"
        elif [[ "$choice" =~ "install_msu" ]]; then
            set_ini "EnableMSU" "true" "$ini_path"
            mkdir -p "$game_dir/msu"

            local msu_type
            msu_type=$(gui_radiolist "What format is your MSU-1 pack in?" "MSU Source Type" \
                "archive" "A compressed archive file (.zip, .7z, .rar, .tar, .gz)" on \
                "folder" "An uncompressed folder containing the .pcm files" off)

            if [ $? -eq 0 ] && [ -n "$msu_type" ]; then
                if [[ "$msu_type" =~ "archive" ]]; then
                    local msu_source
                    msu_source=$(gui_getopenfilename "$HOME" "Archives (*.zip *.7z *.rar *.tar *.gz)" "Select your MSU-1 Archive")
                    if [ $? -eq 0 ] && [ -f "$msu_source" ]; then
                        gui_msgbox "Ready to extract the audio pack.\n\nOnce you click OK, the files will extract in the background. Please wait for the success message!" "Extracting Audio"
                        local temp_ext_dir="$game_dir/msu_temp_extract"
                        mkdir -p "$temp_ext_dir"
                        bsdtar -xf "$msu_source" -C "$temp_ext_dir"
                        find "$temp_ext_dir" -type f -iname "*.pcm" -exec mv {} "$game_dir/msu/" \;
                        rm -rf "$temp_ext_dir"
                        gui_msgbox "MSU Audio tracks successfully installed to:\n$game_dir/msu/\n\nYou can safely delete the original archive." "MSU Complete"
                    fi
                elif [[ "$msu_type" =~ "folder" ]]; then
                    local msu_source
                    msu_source=$(gui_getexistingdirectory "$HOME" "Select the folder containing your .pcm files")
                    if [ $? -eq 0 ] && [ -d "$msu_source" ]; then
                        gui_msgbox "Ready to copy the audio pack.\n\nOnce you click OK, files will copy in the background. Please wait for the success message!" "Copying Audio"
                        find "$msu_source" -type f -iname "*.pcm" -exec cp {} "$game_dir/msu/" \;
                        gui_msgbox "MSU Audio tracks successfully copied to:\n$game_dir/msu/" "MSU Complete"
                    fi
                fi
            fi
        elif [[ "$choice" =~ "freq" ]]; then
            local sel_freq
            sel_freq=$(gui_radiolist "Select audio output frequency:" "Audio Frequency" \
                "44100" "44100 Hz (Standard CD Quality - Recommended)" "$([ "$cur_freq" == "44100" ] && echo "on" || echo "off")" \
                "48000" "48000 Hz (Studio / Broadcast Quality)" "$([ "$cur_freq" == "48000" ] && echo "on" || echo "off")")
            if [ $? -eq 0 ] && [ -n "$sel_freq" ]; then
                set_ini "AudioFreq" "$sel_freq" "$ini_path"
                gui_msgbox "Audio frequency set to \${sel_freq} Hz!\n\nSaved to zelda3.ini." "Updated"
            fi
        elif [[ "$choice" =~ "channels" ]]; then
            local new_chan="2"
            if [ "$cur_chan" == "2" ]; then new_chan="1"; fi
            set_ini "AudioChannels" "$new_chan" "$ini_path"
            local new_c_str="Stereo (2 Channels)"
            if [ "$new_chan" == "1" ]; then new_c_str="Mono (1 Channel)"; fi
            gui_msgbox "Audio channels set to $new_c_str!\n\nSaved to zelda3.ini." "Updated"
        fi
    done
}

# --- FUNCTION: settings & tweaks categorized hub ---
configure_settings() {
    local target_dir="$1"
    local ini_path="$target_dir/zelda3.ini"

    if [ ! -f "$ini_path" ]; then
        gui_error "Could not find zelda3.ini at $ini_path.\nMake sure the game is installed first!" "Settings Error"
        return 1
    fi

    while true; do
        local cur_ar=$(get_ini "ExtendedAspectRatio" "16:10" "$ini_path")
        local cur_fs=$(get_ini "Fullscreen" "1" "$ini_path")
        local fs_str="Fullscreen"
        [ "$cur_fs" == "0" ] && fs_str="Windowed"
        local cur_filt=$(get_ini "LinearFiltering" "0" "$ini_path")
        local filt_str="Crisp"
        [ "$cur_filt" == "1" ] && filt_str="Smooth"
        local cur_msu=$(get_ini "EnableMSU" "false" "$ini_path")
        local msu_str="Disabled"
        if [ "$cur_msu" == "true" ] || [ "$cur_msu" == "1" ]; then msu_str="Enabled"; fi
        local cur_misc=$(get_ini "MiscBugFixes" "1" "$ini_path")
        local misc_str="Enabled"
        [ "$cur_misc" == "0" ] && misc_str="Disabled"
        local cur_game=$(get_ini "GameChangingBugFixes" "0" "$ini_path")
        local game_str="Disabled"
        if [ "$cur_game" == "1" ] || [ "$cur_game" == "true" ]; then game_str="Enabled"; fi

        local qol_check_keys=("ItemSwitchLR" "TurnWhileDashing" "BreakPotsWithSword" "CollectItemsWithSword" "DisableLowHealthBeep" "CancelBirdTravel" "ShowMaxItemsInYellow" "SkipIntroOnKeypress" "MoreActiveBombs" "EnhancedMode7" "MirrorToDarkworld" "CarryMoreRupees")
        local qol_count=0
        for qk in "\${qol_check_keys[@]}"; do
            local qv
            qv=$(get_ini "$qk" "0" "$ini_path")
            [ "$qv" == "1" ] || [ "$qv" == "true" ] && ((qol_count++))
        done

        local summary="⚙️ ZELDA 3 CONFIGURATION HUB\n\n📌 Live Status (auto-saved to zelda3.ini):\n• Video: $cur_ar ($fs_str, $filt_str)\n• Audio: MSU-1 CD Audio: $msu_str\n• Bug Fixes: Misc Polish: $misc_str | Sequence Breaks Patched: $game_str\n• Gameplay QoL: $qol_count of 12 features enabled"

        local cat_choice
        cat_choice=$(gui_menu "Select a category below to tweak, or select 'Save & Exit':" "Zelda 3 Settings & Tweaks" \
            "display"   "📺 Display & Graphics ($cur_ar, $fs_str, $filt_str)" \
            "gameplay"  "🎮 Gameplay & Quality of Life ($qol_count of 12 Enabled)" \
            "bugfixes"  "🐛 Bug Fixes & Exploits (Misc: $misc_str | Sequence Breaks: $game_str)" \
            "audio"     "🔊 Audio & MSU-1 Setup (MSU-1: $msu_str | \${cur_freq}Hz)" \
            "status"    "📋 View Live zelda3.ini Status Summary" \
            "done"      "💾 Save & Exit to Manager Hub")

        if [ $? -ne 0 ] || [ -z "$cat_choice" ] || [[ "$cat_choice" =~ "done" ]]; then
            gui_msgbox "All changes are saved to zelda3.ini!\n\nYou're all set to launch the game." "Settings Saved"
            break
        fi

        if [[ "$cat_choice" =~ "status" ]]; then
            gui_msgbox "$summary" "Live zelda3.ini Status"
        elif [[ "$cat_choice" =~ "display" ]]; then
            configure_display "$ini_path"
        elif [[ "$cat_choice" =~ "gameplay" ]]; then
            configure_gameplay "$ini_path"
        elif [[ "$cat_choice" =~ "bugfixes" ]]; then
            configure_bugfixes "$ini_path"
        elif [[ "$cat_choice" =~ "audio" ]]; then
            configure_audio "$ini_path"
        fi
    done
}

# --- FUNCTION: backup saves ---
backup_save() {
    local install_dir="$1"
    local saves_dir="$install_dir/saves"
    
    if [ ! -f "$saves_dir/sram.dat" ]; then
        gui_error "No save file found!\n\nYou need to play the game and save at least once before you can back anything up." "Backup Failed"
        return
    fi

    local backup_dir
    backup_dir=$(gui_getexistingdirectory "$HOME" "Select where to save your backup")
    
    if [ $? -eq 0 ] && [ -n "$backup_dir" ]; then
        cp "$saves_dir/sram.dat" "$backup_dir/"
        gui_msgbox "Save data successfully backed up to:\n$backup_dir" "Backup Complete"
    fi
}

# --- FUNCTION: restore saves ---
restore_save() {
    local install_dir="$1"
    local saves_dir="$install_dir/saves"
    
    local backup_file
    backup_file=$(gui_getopenfilename "$HOME" "Save Files (sram.dat);;All Files (*)" "Select your sram.dat file to restore")
    
    if [ $? -eq 0 ] && [ -n "$backup_file" ]; then
        mkdir -p "$saves_dir"
        cp "$backup_file" "$saves_dir/sram.dat"
        gui_msgbox "Save file successfully restored!" "Restore Complete"
    fi
}

# --- FUNCTION: universal build environment ---
build_game() {
    local install_dir="$1"
    local build_script="$install_dir/build.sh"

    # Write the core build script
    cat << \EOF > "$build_script"
#!/bin/bash
set -e
cd "$1"
git clone https://github.com/snesrev/zelda3.git src
mv zelda3.sfc src/
cd src

# Compatibility fixes for modern compilers (Clang 16+ / Clang 21 / C23 default dialect):
# 1. Update unprototyped VWF_RenderSingle declaration in messaging.h to match definition
find . -name "messaging.h" -exec sed -i 's/void VWF_RenderSingle();/void VWF_RenderSingle(int c);/' {} + 2>/dev/null || true
# 2. Prevent compiler warnings from halting the build
find . -name "Makefile" -exec sed -i 's/-Werror//g' {} + 2>/dev/null || true

# 3. Explicitly compile with GNU C17 standard to ensure backward compatibility
CC="clang -std=gnu17" make
mv zelda3 zelda3.ini zelda3_assets.dat ../
EOF
    chmod +x "$build_script"

    if command -v distrobox >/dev/null 2>&1; then
        echo "Using distrobox for isolated build..."
        distrobox create -n zelda-build -i ubuntu:22.04 -Y
        
        # Inject dependencies into the distrobox build script wrapper
        cat << \EOF > "$install_dir/db_build.sh"
#!/bin/bash
set -e
sudo apt update && sudo apt install -y build-essential clang python3 python3-yaml python3-pil libsdl2-dev git libarchive-tools
"$1/build.sh" "$1"
EOF
        chmod +x "$install_dir/db_build.sh"
        
        if distrobox enter zelda-build -- "$install_dir/db_build.sh" "$install_dir"; then
            rm "$install_dir/db_build.sh"
            return 0
        else
            return 1
        fi
    else
        echo "Distrobox not found. Falling back to native compilation."
        
        # Detect package manager
        local pkg_mgr=""
        local install_cmd=""
        if command -v apt >/dev/null 2>&1; then
            pkg_mgr="apt"
            install_cmd="apt update && apt install -y build-essential clang python3 python3-yaml python3-pil libsdl2-dev git libarchive-tools"
        elif command -v pacman >/dev/null 2>&1; then
            pkg_mgr="pacman"
            install_cmd="pacman -Sy --noconfirm base-devel clang python python-yaml python-pillow sdl2 git libarchive"
        elif command -v dnf >/dev/null 2>&1; then
            pkg_mgr="dnf"
            install_cmd="dnf install -y @development-tools clang python3 python3-pyyaml python3-pillow SDL2-devel git libarchive"
        else
            gui_error "Could not detect a supported package manager (apt, pacman, dnf) and distrobox is missing.\nPlease manually install build dependencies (clang, python3, sdl2, git, yaml, pillow) and try again." "Build Error"
            return 1
        fi

        gui_msgbox "Native compilation mode detected.\nThe script needs to install dependencies using '$pkg_mgr'.\nYou will be prompted for your sudo password in the terminal." "Dependency Installation"
        
        # Use pkexec if available, otherwise fallback to sudo (assuming terminal launch)
        if command -v pkexec >/dev/null 2>&1; then
            if ! pkexec bash -c "$install_cmd"; then
                gui_error "Dependency installation failed or was cancelled." "Build Error"
                return 1
            fi
        else
            echo "Requesting sudo permissions to install dependencies..."
            if ! sudo bash -c "$install_cmd"; then
                gui_error "Dependency installation failed." "Build Error"
                return 1
            fi
        fi

        # Run the build script natively
        if "$build_script" "$install_dir"; then
            return 0
        else
            return 1
        fi
    fi
}

# --- FUNCTION: installation & compile ---
run_install() {
    local base_dir
    base_dir=$(gui_getexistingdirectory "$HOME" "Select where to install (we will create a Zelda3 folder here)")
    if [ $? -ne 0 ] || [ -z "$base_dir" ]; then
        exit 0
    fi

    local install_dir="$base_dir/Zelda3"
    
    # smart rebuild: protect the sram.dat save and MSU tracks if this is a reinstall
    if [ -d "$install_dir" ]; then
        mkdir -p "/tmp/zelda_backup_temp/saves"
        if [ -f "$install_dir/saves/sram.dat" ]; then
            cp "$install_dir/saves/sram.dat" "/tmp/zelda_backup_temp/saves/"
        fi
        cp -r "$install_dir/msu" "/tmp/zelda_backup_temp/" 2>/dev/null || true
        
        rm -rf "$install_dir"
        mkdir -p "$install_dir"
        mkdir -p "$install_dir/saves"
        
        if [ -f "/tmp/zelda_backup_temp/saves/sram.dat" ]; then
            cp "/tmp/zelda_backup_temp/saves/sram.dat" "$install_dir/saves/"
        fi
        cp -r "/tmp/zelda_backup_temp/msu" "$install_dir/" 2>/dev/null || true
        rm -rf "/tmp/zelda_backup_temp"
    else
        mkdir -p "$install_dir"
    fi

    local rom_path
    rom_path=$(gui_getopenfilename "$HOME" "SNES ROMs (*.sfc);;All Files (*)" "Select your US Zelda 3 ROM")
    if [ $? -ne 0 ] || [ -z "$rom_path" ]; then
        [ ! -f "$install_dir/saves/sram.dat" ] && rm -rf "$install_dir"
        exit 0
    fi

    local expected_hash="66871d66be19ad2c34c927d6b14cd8eb6fc3181965b6e517cb361f7316009cfb"
    local actual_hash
    actual_hash=$(sha256sum "$rom_path" | awk '{print $1}')

    if [ "$actual_hash" != "$expected_hash" ]; then
        gui_error "Hash mismatch!\n\nThe extractor needs a clean, unheadered US 1.0 ROM.\nYour ROM's hash: $actual_hash\nExpected: $expected_hash" "Wrong ROM Version"
        [ ! -f "$install_dir/saves/sram.dat" ] && rm -rf "$install_dir"
        exit 1
    fi

    cp "$rom_path" "$install_dir/zelda3.sfc"

    gui_msgbox "ROM verified!\n\nThe script will now download the compiler tools and build the game. Lots of text will scroll by in the background terminal.\n\nIt might look like it's frozen for 2-3 minutes. Just let it run in the background! Do not close the window." "Building Zelda 3"

    echo -e "\n======================================================="
    echo " 📦 DOWNLOADING TOOLS & COMPILING GAME..."
    echo " This takes 2-3 minutes. Do not close this window."
    echo "=======================================================\n"

    if build_game "$install_dir"; then
        cd "$install_dir"
        rm -rf "$install_dir/src"
        rm -f "$install_dir/build.sh"

        # Ensure zelda3-manager.sh is installed and self-contained
        if [ -s "$0" ] && [ "$0" != "/dev/fd/"* ] && [ "$0" != "bash" ]; then
            cp "$0" "$install_dir/zelda3-manager.sh"
        else
            echo "Writing standalone Zelda 3 Manager..."
            curl -sSL "https://raw.githubusercontent.com/phanguy/Zelda-3-Linux-Installer-Manager/main/zelda3-manager.sh" -o "$install_dir/zelda3-manager.sh" 2>/dev/null || true
        fi
        
        # In case curl was blocked or offline, ensure we have an executable file
        chmod +x "$install_dir/zelda3-manager.sh" 2>/dev/null || true
        ln -sf "$install_dir/zelda3-manager.sh" "$install_dir/zelda-manager.sh" 2>/dev/null || true
        chmod +x "$install_dir/zelda-manager.sh" 2>/dev/null || true

        # Create launcher wrapper so zelda3 can be launched from any working directory
        cat << 'LAUNCHER' > "$install_dir/run-zelda3.sh"
#!/bin/bash
DIR="$(cd "$(dirname "\$0")" && pwd)"
cd "$DIR"
exec "./zelda3" "$@"
LAUNCHER
        chmod +x "$install_dir/run-zelda3.sh"

        mkdir -p "$HOME/Desktop"
        mkdir -p "$HOME/.local/share/applications"
        
        # 1. Create Zelda 3 Manager desktop shortcuts
        local manager_entry="[Desktop Entry]
Name=Zelda 3 Manager
Comment=Configure Zelda 3 settings, tweaks, and backups
Exec=$install_dir/zelda3-manager.sh --manage \"$install_dir\"
Path=$install_dir
Icon=preferences-desktop
Terminal=false
Type=Application
Categories=Settings;Game;"

        echo "$manager_entry" > "$HOME/Desktop/Zelda3-Manager.desktop"
        chmod +x "$HOME/Desktop/Zelda3-Manager.desktop"
        echo "$manager_entry" > "$HOME/.local/share/applications/zelda3-manager.desktop"
        chmod +x "$HOME/.local/share/applications/zelda3-manager.desktop"

        # 2. Always create Zelda 3 game launcher shortcuts
        local game_entry="[Desktop Entry]
Name=The Legend of Zelda: A Link to the Past
Comment=Native PC port of The Legend of Zelda: A Link to the Past
Exec=$install_dir/run-zelda3.sh
Path=$install_dir
Icon=input-gaming
Terminal=false
Type=Application
Categories=Game;"
        
        echo "$game_entry" > "$HOME/.local/share/applications/zelda3.desktop"
        chmod +x "$HOME/.local/share/applications/zelda3.desktop"
        echo "$game_entry" > "$HOME/Desktop/Play-Zelda3.desktop"
        chmod +x "$HOME/Desktop/Play-Zelda3.desktop"

        # Mark desktop shortcuts as trusted & executable for both GNOME and KDE Plasma
        if command -v gio >/dev/null 2>&1; then
            gio set "$HOME/Desktop/Play-Zelda3.desktop" metadata::trusted true 2>/dev/null || true
            gio set "$HOME/Desktop/Zelda3-Manager.desktop" metadata::trusted true 2>/dev/null || true
        fi
        # Specific to KDE Plasma on Fedora (kwriteconfig5 / kwriteconfig6)
        for cfg in kwriteconfig6 kwriteconfig5; do
            if command -v $cfg >/dev/null 2>&1; then
                $cfg --file "$HOME/Desktop/Zelda3-Manager.desktop" --group "Desktop Entry" --key "X-KDE-AuthorizeAction" "all" 2>/dev/null || true
                $cfg --file "$HOME/Desktop/Play-Zelda3.desktop" --group "Desktop Entry" --key "X-KDE-AuthorizeAction" "all" 2>/dev/null || true
            fi
        done
        update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true

        echo -e "\n======================================================="
        echo " ✅ ALL DONE! Game installed to $install_dir"
        echo "=======================================================\n"

        local steam_instructions=""
        local has_steam=0
        if command -v steam >/dev/null 2>&1 || [ -d "$HOME/.steam" ]; then
            has_steam=1
        fi

        if [ "$has_steam" -eq 1 ]; then
            steam_instructions="\n\nSteam was detected! A 'Play-Zelda3' icon has been placed on your Desktop. Right-click it, hit 'Add to Steam', and then you can drag the shortcut to the trash."
        else
            steam_instructions="\n\n'Play-Zelda3' and 'Zelda 3 Manager' shortcuts have been placed on your Desktop and in your Applications menu."
        fi

        if gui_yesno "Zelda 3 compiled successfully!$steam_instructions\n\nWould you like to configure display and gameplay tweaks right now?" "Install Complete!"; then
            configure_settings "$install_dir"
        fi

    else
        echo -e "\n======================================================="
        echo " ❌ ERROR: Build failed! Check the log above."
        echo "=======================================================\n"
        gui_error "The build failed!\n\nCheck the terminal window for details.\n\nThe incomplete install folder has been wiped out." "Build Error"
        [ ! -f "$install_dir/saves/sram.dat" ] && rm -rf "$install_dir"
        exit 1
    fi
}

# ==============================================================================
# 3. ROOT LAUNCH LOGIC
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0" 2>/dev/null)" 2>/dev/null && pwd)"

if [ "$1" = "--manage" ]; then
    if [ -n "$2" ]; then
        INSTALL_DIR="$2"
    elif [ -f "$SCRIPT_DIR/zelda3.ini" ]; then
        INSTALL_DIR="$SCRIPT_DIR"
    else
        INSTALL_DIR=$(gui_getexistingdirectory "$HOME" "Select the Zelda3 installation folder to manage:")
        if [ $? -ne 0 ] || [ -z "$INSTALL_DIR" ]; then
            exit 0
        fi
    fi
elif [ -f "$SCRIPT_DIR/zelda3.ini" ] && [ -f "$SCRIPT_DIR/zelda3_assets.dat" ]; then
    # When launched directly from inside the game folder (e.g. clicking zelda-manager.sh in file manager)
    INSTALL_DIR="$SCRIPT_DIR"
fi

if [ -n "$INSTALL_DIR" ]; then
    while true; do
        CHOICE=$(gui_menu "ZELDA 3 MANAGER HUB\n\nTarget Game Directory:\n$INSTALL_DIR\n\nSelect an option below:" "Zelda 3 Manager Hub" \
            "settings"  "⚙️ Configure Game Settings & Tweaks" \
            "backup"    "💾 Backup Save Data" \
            "restore"   "📂 Restore Save Data" \
            "reinstall" "🔄 Reinstall / Repair Game" \
            "exit"      "🚪 Exit Manager")

        if [ $? -ne 0 ] || [ -z "$CHOICE" ] || [[ "$CHOICE" =~ "exit" ]]; then
            exit 0
        fi

        if [[ "$CHOICE" =~ "settings" ]]; then
            configure_settings "$INSTALL_DIR"
        elif [[ "$CHOICE" =~ "backup" ]]; then
            backup_save "$INSTALL_DIR"
        elif [[ "$CHOICE" =~ "restore" ]]; then
            restore_save "$INSTALL_DIR"
        elif [[ "$CHOICE" =~ "reinstall" ]]; then
            if gui_yesno "Are you sure you want to rebuild the game?\n\n(Don't worry, your save data and MSU audio files will be safely backed up and restored automatically!)" "Confirm Reinstall"; then
                run_install
                exit 0
            fi
        fi
    done
else
    run_install
fi
`;
