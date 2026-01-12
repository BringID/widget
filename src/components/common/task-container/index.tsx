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
import { TTaskGroup, TVerificationStatus } from '@/types';
import { defineTaskPointsRange } from '@/utils';

const defineTiers = (groups?: TTaskGroup[]) => {
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
}

const defineDescription = (
  status: TVerificationStatus,
  groups?: TTaskGroup[]
) => {
  if (status === 'completed') {
    return 'Verified'
  }
  if (groups) {
    return defineTaskPointsRange(groups)
  }
}


const TaskContainer: FC<TProps> = ({
  status,
  children,
  title,
  icon,
  id,
  selectable,
  groups,
  selected,
  onSelect,
}) => {
  const tiers = groups ? defineTiers(groups) : undefined
  const descriptionContent = defineDescription(status, groups)

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
          <Subtitle>{descriptionContent}</Subtitle>
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
