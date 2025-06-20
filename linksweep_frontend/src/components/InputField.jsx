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
        className={`clean-input-wrapper ${isFocused ? "focused" : ""} ${value ? "has-value" : ""}`}
      >
        {icon && <span className="input-icon-clean">{icon}</span>}
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
          className="clean-input"
          style={{
            paddingLeft: icon ? "3rem" : "1rem",
            paddingRight: type === "password" ? "3rem" : "1rem",
          }}
        />
        {type === "password" && (
          <div className="password-toggle-clean" onClick={handleTogglePassword}>
            {showPassword ? "👁️" : "👁️‍🗨️"}
          </div>
        )}
      </div>
    </div>
  );
};

export default InputField;
