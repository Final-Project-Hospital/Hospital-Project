import styled from "styled-components";
import { BlockWrapStyles } from "../../../../../style/global/default";
import { media } from "../../../../../style/theme/theme";

export const TopProductsWrap = styled.div`
  ${BlockWrapStyles};
  overflow-x: scroll;

  &::-webkit-scrollbar {
    height: 6px;
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 100vh !important;
    background-color: #e9e9e9;
    outline: 1px solid rgba(0, 0, 0, 0.02);
    outline-offset: -1px;
  }

  .tbl-products {
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 500px;

      td,
      th {
        padding: 12px 16px;
        font-size: 14px;

        ${media.lg`
          padding: 8px 10px;
        `}
      }

      thead {
        th {
          border-bottom: 1px solid ${(props) => props.theme.colors.aliceBlue};
          color: ${(props) => props.theme.colors.gray700};
          font-weight: 400;
          text-align: left;

          &:nth-child(3) {
            min-width: 140px;
          }
        }
      }

      tbody {
        td {
          color: ${(props) => props.theme.colors.gray700};
          border-bottom: 1px solid ${(props) => props.theme.colors.aliceBlue};
        }

        .tbl-progress-bar {
          min-width: 350px;
          height: 10px;
          border-radius: 100vh;
          overflow: hidden;
          position: relative;

          ${media.lg`
            min-width: auto;
          `}

          .bar-fill {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 0;
            border-radius: 100vh;
          }
        }

        .tbl-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 45px;
          height: 24px;
          border: 1px solid transparent;
          border-radius: 6px;
        }
      }
    }
  }
`;
