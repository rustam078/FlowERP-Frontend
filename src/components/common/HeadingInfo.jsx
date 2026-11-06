import React from 'react';
import { Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

/**
 * Small info icon shown right after a page heading. On hover it reveals the
 * page's description as a tooltip — replacing the old inline subtitle text.
 */
const HeadingInfo = ({ text }) => (
  <Tooltip
    title={text}
    placement="top"
    getPopupContainer={() => document.body}
    styles={{ root: { maxWidth: 320, zIndex: 2000 } }}
  >
    <InfoCircleOutlined
      style={{ color: '#94A3B8', fontSize: 15, cursor: 'help', marginLeft: 8, verticalAlign: 'middle' }}
    />
  </Tooltip>
);

export default HeadingInfo;
