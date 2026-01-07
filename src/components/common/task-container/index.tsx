import React, { FC } from 'react';
import TProps from './types';
import {
  Container,
  Title,
  Subtitle,
  Content,
  ImageWrapper,
  Icon,
  CheckboxStyled,
  Tiers,
  Tier,
  Body,
  Footer,
} from './styled-components';
import { TNotarizationGroup } from '@/types';

const defineTiers = (groups?: TNotarizationGroup[]) => {
  if (!groups || groups.length === 1) return null;

  return groups
    .map((group) => {
      const checks = group.checks;
      if (!checks) {
        return '';
      }

      return `${checks[0].value}+: ${group.points} pts.`;
    })
    .filter((item) => item);
};

const TaskContainer: FC<TProps> = ({
  status,
  children,
  title,
  description,
  icon,
  id,
  selectable,
  groups,
  selected,
  onSelect,
}) => {
  const tiers = groups ? defineTiers(groups) : undefined
  return (
    <Container status={status}>
      <Body selectable={selectable}>
        {selectable && (
          <CheckboxStyled
            checked={Boolean(selected)}
            onClick={onSelect}
            id={id}
          />
        )}
        <ImageWrapper>
          <Icon src={icon} />
        </ImageWrapper>
        <Content>
          <Title>{title}</Title>
          <Subtitle>{description}</Subtitle>
        </Content>
        {children}
      </Body>
      {tiers && (
        <Footer>
          Tiers:
          <Tiers>
            {tiers.reverse().map((tier) => (
              <Tier>{tier}</Tier>
            ))}
          </Tiers>
        </Footer>
      )}
    </Container>
  );
};

export default TaskContainer;
