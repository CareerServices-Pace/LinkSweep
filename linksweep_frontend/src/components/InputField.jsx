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

  return (
    <div className="input-field">
      {label && <label className="input-label">{label}</label>}
      <div
        className={`unified-wrapper ${isFocused ? "focused" : ""} ${value ? "has-value" : ""}`}
      >
        {icon && <span className="static-icon">{icon}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
          className="unified-input"
          style={{
            paddingLeft: icon ? "3rem" : "1rem",
            paddingRight: "1rem",
          }}
        />
      </div>
    </div>
  );
};

export default InputField;
