import React, { useState } from "react";
import "./InputField.css";

const InputField = ({
  type = "text",
  placeholder,
  value,
  onChange,
  label,
  required = false,
  icon,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <div className="input-field">
      {label && <label className="input-label">{label}</label>}
      <div
        className={`input-container ${isFocused ? "focused" : ""} ${value ? "has-value" : ""}`}
      >
        {icon && <span className="input-icon">{icon}</span>}
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
          className="input"
        />
        {type === "password" && (
          <button
            type="button"
            className="password-toggle"
            onClick={handleTogglePassword}
          >
            {showPassword ? "👁️" : "👁️‍🗨️"}
          </button>
        )}
      </div>
    </div>
  );
};

export default InputField;
