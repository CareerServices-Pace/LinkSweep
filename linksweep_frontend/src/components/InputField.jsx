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
        className={`seamless-wrapper ${isFocused ? "focused" : ""} ${value ? "has-value" : ""}`}
      >
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
          className={`seamless-input ${icon ? "with-icon" : ""} ${type === "password" ? "with-toggle" : ""}`}
        />
        {icon && <span className="absolute-icon">{icon}</span>}
        {type === "password" && (
          <span className="absolute-toggle" onClick={handleTogglePassword}>
            {showPassword ? "👁️" : "👁️‍🗨️"}
          </span>
        )}
      </div>
    </div>
  );
};

export default InputField;
